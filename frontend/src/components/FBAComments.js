import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Heart, 
  Reply, 
  Trash2, 
  Image, 
  Video, 
  X,
  Clock
} from 'lucide-react';
import './FBAComments.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const FBAComments = ({ locationCode }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // 加载评论
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/fba/locations/${locationCode}/comments`, {
        headers: isAuthenticated ? {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [locationCode, isAuthenticated]);

  // 处理文件选择
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('最多只能上传5个文件');
      return;
    }

    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const size = file.size / 1024 / 1024; // MB

      if (!isImage && !isVideo) {
        alert(`${file.name} 不是有效的图片或视频文件`);
        return false;
      }

      if (size > 50) {
        alert(`${file.name} 文件过大，最大支持50MB`);
        return false;
      }

      return true;
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  // 移除文件
  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // 提交评论
  const submitComment = async (isReply = false) => {
    const content = isReply ? replyContent : newComment;
    if (!content.trim() && selectedFiles.length === 0) {
      alert('请输入评论内容或选择要上传的文件');
      return;
    }

    if (!isAuthenticated) {
      alert('请先登录后再发表评论');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('content', content.trim());
      
      if (isReply && replyingTo) {
        formData.append('parent_id', replyingTo);
      }

      selectedFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await fetch(`${API_BASE_URL}/fba/locations/${locationCode}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (isReply) {
          setReplyContent('');
          setReplyingTo(null);
        } else {
          setNewComment('');
          setSelectedFiles([]);
        }
        fetchComments(); // 重新加载评论
      } else {
        const errorData = await response.json();
        alert(errorData.message || '发表评论失败');
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      alert('提交评论失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 点赞评论
  const likeComment = async (commentId) => {
    if (!isAuthenticated) {
      alert('请先登录后再点赞');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/fba/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComments(comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              like_count: data.data.like_count,
              is_liked: data.data.is_liked
            };
          }
          // 处理回复的点赞
          if (comment.replies) {
            comment.replies = comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  like_count: data.data.like_count,
                  is_liked: data.data.is_liked
                };
              }
              return reply;
            });
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 删除评论
  const deleteComment = async (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/fba/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        fetchComments(); // 重新加载评论
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      alert('删除评论失败，请稍后重试');
    }
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString();
  };

  // 渲染媒体文件
  const renderMediaFiles = (mediaFiles) => {
    if (!mediaFiles || mediaFiles.length === 0) return null;

    return (
      <div className="comment-media">
        {mediaFiles.map((file, index) => (
          <div key={index} className="media-item">
            {file.file_type === 'image' ? (
              <img 
                src={`${API_BASE_URL}${file.file_url}`} 
                alt="Comment media" 
                className="media-image"
              />
            ) : (
              <video 
                src={`${API_BASE_URL}${file.file_url}`} 
                controls 
                className="media-video"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // 渲染评论
  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`comment ${isReply ? 'reply' : ''}`}>
      <div className="comment-header">
        <div className="user-info">
          <div className="user-avatar">
            {comment.user.first_name?.[0] || comment.user.email[0].toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">
              {comment.user.first_name} {comment.user.last_name} 
            </span>
            <span className="comment-time">
              <Clock size={14} />
              {formatTime(comment.created_at)}
            </span>
          </div>
        </div>
        {isAuthenticated && user && comment.user.id === user.id && (
          <button 
            className="delete-btn" 
            onClick={() => deleteComment(comment.id)}
            title="删除评论"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      <div className="comment-content">
        <p>{comment.content}</p>
        {renderMediaFiles(comment.mediaFiles)}
      </div>
      
      <div className="comment-actions">
        <button 
          className={`action-btn ${comment.is_liked ? 'liked' : ''}`}
          onClick={() => likeComment(comment.id)}
          disabled={!isAuthenticated}
          title={!isAuthenticated ? '请先登录' : ''}
        >
          <Heart size={16} />
          <span>{comment.like_count || 0}</span>
        </button>
        
        {!isReply && (
          <button 
            className="action-btn"
            onClick={() => {
              if (!isAuthenticated) {
                alert('请先登录后再回复评论');
                return;
              }
              setReplyingTo(replyingTo === comment.id ? null : comment.id);
            }}
            disabled={!isAuthenticated}
            title={!isAuthenticated ? '请先登录' : ''}
          >
            <Reply size={16} />
            回复
          </button>
        )}
      </div>
      
      {/* 回复输入框 */}
      {replyingTo === comment.id && (
        <div className="reply-form">
          <div className="comment-input">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下您的回复..."
              rows="2"
            />
            <div className="input-actions">
              <button 
                className="action-btn"
                onClick={() => setReplyingTo(null)}
              >
                取消
              </button>
              <button 
                className="submit-btn"
                onClick={() => submitComment(true)}
                disabled={submitting || !replyContent.trim()}
              >
                {submitting ? '发送中...' : '回复'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="comments-section">
        <div className="comments-header">
          <h3><MessageSquare size={20} /> 用户评论</h3>
        </div>
        <div className="loading">加载评论中...</div>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3>
          <MessageSquare size={20} /> 
          用户评论 ({comments.length})
        </h3>
      </div>

      {/* 发表评论 */}
      {isAuthenticated ? (
        <div className="comment-form">
          <div className="comment-input">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="分享您对这个FBA仓库的经验..."
              rows="3"
            />
            
            {/* 文件选择预览 */}
            {selectedFiles.length > 0 && (
              <div className="selected-files">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-preview">
                    <div className="file-info">
                      {file.type.startsWith('image/') ? <Image size={16} /> : <Video size={16} />}
                      <span>{file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(index)}
                      className="remove-file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="input-actions">
              <div className="left-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                />
                <button 
                  type="button"
                  className="media-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedFiles.length >= 5}
                >
                  <Image size={16} />
                  图片/视频
                </button>
              </div>
              
              <button 
                className="submit-btn"
                onClick={() => submitComment(false)}
                disabled={submitting || (!newComment.trim() && selectedFiles.length === 0)}
              >
                <Send size={16} />
                {submitting ? '发送中...' : '发表评论'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="login-prompt">
          <p>请<a href="/login">登录</a>后发表评论</p>
        </div>
      )}

      {/* 评论列表 */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <MessageSquare size={48} />
            <p>暂时无评论</p>
            <span>成为第一个分享经验的人！</span>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
};

export default FBAComments;