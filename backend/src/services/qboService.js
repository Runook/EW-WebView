const { qboRequest } = require('../config/quickbooks');
const { db } = require('../config/database');

/**
 * Find a QBO Customer by DisplayName, or create one if not found.
 * Stores the QBO Customer ID on the local customers table.
 */
async function findOrCreateCustomer(companyName) {
  if (!companyName) throw new Error('Company name is required');

  // Check local DB first for a cached qb_customer_id
  const localCustomer = await db('customers')
    .whereRaw('LOWER(company_name) = LOWER(?)', [companyName])
    .first();

  if (localCustomer?.qb_customer_id) {
    return localCustomer.qb_customer_id;
  }

  // Query QBO by DisplayName
  const safeName = companyName.replace(/'/g, "\\'");
  const query = `SELECT * FROM Customer WHERE DisplayName = '${safeName}'`;
  const result = await qboRequest('GET', `/query?query=${encodeURIComponent(query)}`);

  const existing = result?.QueryResponse?.Customer?.[0];
  if (existing) {
    if (localCustomer) {
      await db('customers').where('id', localCustomer.id).update({
        qb_customer_id: existing.Id,
        qb_synced_at: new Date(),
      });
    }
    return existing.Id;
  }

  // Create new customer in QBO
  const newCustomer = await qboRequest('POST', '/customer', {
    DisplayName: companyName,
    CompanyName: companyName,
    BillAddr: localCustomer ? {
      Line1: localCustomer.billing_address || localCustomer.address || '',
      City: localCustomer.billing_city || localCustomer.city || '',
      CountrySubDivisionCode: localCustomer.billing_state || localCustomer.state || '',
      PostalCode: localCustomer.billing_zipcode || localCustomer.zipcode || '',
    } : undefined,
    PrimaryEmailAddr: localCustomer?.email ? { Address: localCustomer.email } : undefined,
    PrimaryPhone: localCustomer?.phone ? { FreeFormNumber: localCustomer.phone } : undefined,
  });

  const qbId = newCustomer.Customer.Id;

  if (localCustomer) {
    await db('customers').where('id', localCustomer.id).update({
      qb_customer_id: qbId,
      qb_synced_at: new Date(),
    });
  }

  console.log(`✅ QBO Customer created: ${companyName} -> ${qbId}`);
  return qbId;
}

/**
 * Find a QBO Item by Name, or create one.
 * Stores qb_item_id on local service_items table.
 */
async function findOrCreateItem(itemName, description, unitPrice) {
  // Check local DB
  const localItem = await db('service_items')
    .whereRaw('LOWER(item_name) = LOWER(?)', [itemName])
    .first();

  if (localItem?.qb_item_id) {
    return localItem.qb_item_id;
  }

  // Query QBO
  const safeName = itemName.replace(/'/g, "\\'");
  const query = `SELECT * FROM Item WHERE Name = '${safeName}'`;
  const result = await qboRequest('GET', `/query?query=${encodeURIComponent(query)}`);

  const existing = result?.QueryResponse?.Item?.[0];
  if (existing) {
    if (localItem) {
      await db('service_items').where('id', localItem.id).update({
        qb_item_id: existing.Id,
      });
    }
    return existing.Id;
  }

  // Need to find an Income account for the item - get the first income account
  const acctQuery = `SELECT * FROM Account WHERE AccountType = 'Income' MAXRESULTS 1`;
  const acctResult = await qboRequest('GET', `/query?query=${encodeURIComponent(acctQuery)}`);
  const incomeAccount = acctResult?.QueryResponse?.Account?.[0];
  if (!incomeAccount) throw new Error('No Income account found in QBO. Please create one first.');

  const newItem = await qboRequest('POST', '/item', {
    Name: itemName,
    Description: description || itemName,
    Type: 'Service',
    UnitPrice: unitPrice || 0,
    IncomeAccountRef: { value: incomeAccount.Id, name: incomeAccount.Name },
  });

  const qbItemId = newItem.Item.Id;

  if (localItem) {
    await db('service_items').where('id', localItem.id).update({ qb_item_id: qbItemId });
  }

  console.log(`✅ QBO Item created: ${itemName} -> ${qbItemId}`);
  return qbItemId;
}

/**
 * Create a QBO Invoice from local order data.
 * Returns the QBO Invoice object.
 */
async function createInvoice({ orders, orderFees, invoiceNumber, customerName }) {
  // Ensure customer exists in QBO
  const customerRef = await findOrCreateCustomer(customerName);

  // Build line items
  const lines = [];
  let lineNum = 1;

  for (const order of orders) {
    const basePrice = parseFloat(order.ew_quote_price) || 0;
    const desc = `${order.cargo_type || 'Freight'} | ${order.origin_city || ''}, ${order.origin_state || ''} → ${order.destination_city || ''}, ${order.destination_state || ''}`;
    const itemName = order.cargo_type === 'FTL' ? 'FTL Freight Transportation' : 'LTL Freight Transportation';

    // Find or create the QBO item for freight
    const freightItemId = await findOrCreateItem(itemName, desc, basePrice);

    lines.push({
      LineNum: lineNum++,
      Amount: basePrice,
      DetailType: 'SalesItemLineDetail',
      Description: `${order.ew_quote_number || order.order_number || ''} - ${desc}`,
      SalesItemLineDetail: {
        ItemRef: { value: freightItemId },
        UnitPrice: basePrice,
        Qty: 1,
      },
    });

    // Additional fees
    const fees = orderFees?.[order.id] || [];
    for (const fee of fees) {
      if (!fee.name || !fee.amount) continue;
      const feeAmount = parseFloat(fee.amount) || 0;
      const feeItemId = await findOrCreateItem(fee.name, `${fee.name} - Order ${order.ew_quote_number || ''}`, feeAmount);
      lines.push({
        LineNum: lineNum++,
        Amount: feeAmount,
        DetailType: 'SalesItemLineDetail',
        Description: `${fee.name} (${order.ew_quote_number || order.order_number || ''})`,
        SalesItemLineDetail: {
          ItemRef: { value: feeItemId },
          UnitPrice: feeAmount,
          Qty: 1,
        },
      });
    }
  }

  // Look up customer email for BillEmail so accountant can send from QBO directly
  let billEmail = null;
  const localCust = await db('customers')
    .whereRaw('LOWER(company_name) = LOWER(?)', [customerName])
    .first();
  if (localCust?.email) {
    billEmail = localCust.email;
  }

  // Calculate due date (default: due on receipt = today)
  const today = new Date();
  const dueDate = today.toISOString().split('T')[0];

  const invoiceBody = {
    CustomerRef: { value: customerRef },
    DocNumber: invoiceNumber,
    TxnDate: today.toISOString().split('T')[0],
    DueDate: dueDate,
    Line: lines,
    CustomerMemo: { value: 'Thank you for choosing Welogx!' },
    BillEmail: billEmail ? { Address: billEmail } : undefined,
    EmailStatus: billEmail ? 'NeedToSend' : undefined,
  };

  const result = await qboRequest('POST', '/invoice', invoiceBody);
  const qboInvoice = result.Invoice;

  console.log(`✅ QBO Invoice created: ${invoiceNumber} -> QBO ID ${qboInvoice.Id}`);
  return qboInvoice;
}

/**
 * Create a QBO Payment when an order is marked paid.
 */
async function syncPayment({ orderId, amount, paymentMethod, referenceNumber }) {
  const order = await db('employee_orders').where('id', orderId).first();
  if (!order) throw new Error('Order not found');

  const customerName = order.inquiry_company || order.customer_name;
  if (!customerName) throw new Error('No customer name on order');

  const customerRef = await findOrCreateCustomer(customerName);

  const paymentBody = {
    CustomerRef: { value: customerRef },
    TotalAmt: amount || parseFloat(order.ew_quote_price) || 0,
    PaymentMethodRef: paymentMethod ? { value: paymentMethod } : undefined,
    PrivateNote: referenceNumber ? `Ref: ${referenceNumber}` : `Order ${order.ew_quote_number || order.id}`,
  };

  const result = await qboRequest('POST', '/payment', paymentBody);
  const qboPayment = result.Payment;

  // Store QBO payment ID locally
  await db('employee_orders').where('id', orderId).update({
    updated_at: new Date(),
  });

  console.log(`✅ QBO Payment synced for order ${orderId} -> QBO ID ${qboPayment.Id}`);
  return qboPayment;
}

/**
 * Reverse sync: query QBO for payment status of all unpaid invoices
 * and update local order payment_status accordingly.
 */
async function syncPaymentStatuses() {
  const unpaidOrders = await db('employee_orders')
    .whereNotNull('invoice_number')
    .where(function() {
      this.whereNull('payment_status')
        .orWhere('payment_status', 'unpaid')
        .orWhere('payment_status', 'partial');
    })
    .select('id', 'invoice_number', 'payment_status', 'ew_quote_price');

  if (!unpaidOrders.length) {
    return { checked: 0, updated: 0, details: [] };
  }

  const details = [];
  let updated = 0;

  for (const order of unpaidOrders) {
    try {
      const safeName = order.invoice_number.replace(/'/g, "\\'");
      const query = `SELECT * FROM Invoice WHERE DocNumber = '${safeName}'`;
      const result = await qboRequest('GET', `/query?query=${encodeURIComponent(query)}`);
      const qboInvoice = result?.QueryResponse?.Invoice?.[0];

      if (!qboInvoice) continue;

      const balance = parseFloat(qboInvoice.Balance) || 0;
      const totalAmt = parseFloat(qboInvoice.TotalAmt) || 0;

      let newStatus = null;
      if (balance === 0 && totalAmt > 0) {
        newStatus = 'paid';
      } else if (balance > 0 && balance < totalAmt) {
        newStatus = 'partial';
      }

      if (newStatus && newStatus !== order.payment_status) {
        await db('employee_orders').where('id', order.id).update({
          payment_status: newStatus,
          paid_amount: totalAmt - balance,
          customer_payment_date: newStatus === 'paid' ? new Date() : undefined,
          updated_at: new Date(),
        });
        details.push({
          orderId: order.id,
          invoiceNumber: order.invoice_number,
          oldStatus: order.payment_status || 'unpaid',
          newStatus,
          balance,
          totalAmt,
        });
        updated++;
      }
    } catch (err) {
      console.warn(`⚠️ Failed to check QBO status for ${order.invoice_number}:`, err.message);
    }
  }

  return { checked: unpaidOrders.length, updated, details };
}

module.exports = {
  findOrCreateCustomer,
  findOrCreateItem,
  createInvoice,
  syncPayment,
  syncPaymentStatuses,
};
