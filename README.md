# EW Logistics Platform

A modern logistics platform inspired by DAT (Digital Alchemy Technologies) with Apple Messages green styling. This platform connects shippers and carriers with cutting-edge technology and exceptional service.

## 🚀 Features

- **Freight Board**: Similar to DAT's load matching system with real-time load and truck availability
- **Modern UI**: Clean, Apple Messages-inspired green design (#34C759)
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Service Management**: Comprehensive logistics services including Ocean Freight, FTL/LTL, FBA Shipping, and Warehousing
- **Contact System**: Advanced contact forms and customer communication tools

## 🎨 Design System

- **Primary Color**: Apple Messages Green (#34C759)
- **Typography**: Inter font family with careful spacing and hierarchy
- **Components**: Reusable, accessible components with hover effects and animations
- **Icons**: Lucide React icon library for consistent iconography

## 🛠️ Technology Stack

- **Frontend**: React 18 with functional components and hooks
- **Routing**: React Router DOM for client-side navigation
- **Styling**: Pure CSS with CSS custom properties (variables)
- **Icons**: Lucide React
- **Animations**: CSS animations and Framer Motion
- **Build Tool**: Create React App

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd EW-Web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.js       # Navigation header
│   ├── Header.css
│   ├── Footer.js       # Site footer
│   └── Footer.css
├── pages/              # Main application pages
│   ├── Home.js         # Landing page
│   ├── Home.css
│   ├── Services.js     # Services overview
│   ├── Services.css
│   ├── FreightBoard.js # DAT-like freight matching
│   ├── FreightBoard.css
│   ├── Contact.js      # Contact form and info
│   └── Contact.css
├── App.js              # Main application component
├── App.css
├── index.js            # Application entry point
└── index.css           # Global styles and variables
```

## 🎯 Key Features

### Freight Board
- **Load Matching**: Similar to DAT's load board with search and filtering
- **Equipment Types**: Support for Dry Van, Reefer, Flatbed, etc.
- **Real-time Data**: Mock data showing available loads and trucks
- **Rate Information**: Per-mile calculations and total rates
- **Company Ratings**: Trust and reliability indicators

### Services
- **Ocean Freight**: FCL/LCL services with customs clearance
- **Truck Loads**: FTL and LTL with competitive rates
- **FBA Shipping**: Amazon fulfillment preparation and shipping
- **Warehousing**: Storage and distribution services
- **Air Freight**: Express delivery solutions
- **Last Mile**: Final delivery services

### Modern UX/UI
- **Apple-inspired Design**: Clean, modern interface with green accents
- **Smooth Animations**: CSS and Framer Motion animations
- **Mobile-first**: Responsive design optimized for all devices
- **Accessibility**: Semantic HTML and ARIA labels

## 🚀 Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Removes the single build dependency

## 🌟 Deployment

To deploy this application:

1. Build the project:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting service (Netlify, Vercel, AWS S3, etc.)

## 📝 License Information

- **MC #**: 1094635
- **Broker MC #**: 1281963  
- **UIIA SCAC**: EWLV

## 📞 Contact

- **Phone**: +1 (718) 386-7888
- **Email**: info@ewlogistics.com
- **Location**: Hauppauge, New York, USA

## 🔗 Reference

This project is inspired by [EW Logistics Service Inc.](https://ewftl.com/) and designed to provide a modern, DAT-like freight matching platform with Apple Messages styling.

---

Built with ❤️ using React and modern web technologies. 