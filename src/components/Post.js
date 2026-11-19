import React, { Component } from 'react'
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { addLike, createComment } from '../actions/posts';
import { APIUrls } from '../helpers/urls';
import { getAuthTokenFromLocalStorage, getFormBody } from '../helpers/utils';
import { Comment } from './';
import './Post.css';

// Sanitize malicious script or iframe tags
function sanitizeContent(raw) {
    if (typeof raw !== 'string') return '';
    return raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}

// Safely parse inline markdown and supported HTML tags into React nodes
function parseInline(text, keyPrefix = 'inline') {
    if (!text) return null;

    // Matches **bold**, <b>bold</b>, *italic*, <i>italic</i>
    const tokenRegex = /(\*\*[^\n]+?\*\*|<[bB]>(?:[\s\S]*?)<\/[bB]>|\*[^\n*]+?\*|<[iI]>(?:[\s\S]*?)<\/[iI]>)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
        if (!part) return null;
        const key = `${keyPrefix}-${index}`;

        // Bold Markdown: **text**
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            const inner = part.slice(2, -2);
            return (
                <strong key={key} className="post-formatted-bold">
                    {parseInline(inner, `${key}-b`)}
                </strong>
            );
        }

        // Bold HTML: <b>text</b>
        if (/^<[bB]>[\s\S]*?<\/[bB]>$/i.test(part)) {
            const inner = part.replace(/^<[bB]>/i, '').replace(/<\/[bB]>$/i, '');
            return (
                <strong key={key} className="post-formatted-bold">
                    {parseInline(inner, `${key}-b`)}
                </strong>
            );
        }

        // Italic Markdown: *text*
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
            const inner = part.slice(1, -1);
            return (
                <em key={key} className="post-formatted-italic">
                    {parseInline(inner, `${key}-i`)}
                </em>
            );
        }

        // Italic HTML: <i>text</i>
        if (/^<[iI]>[\s\S]*?<\/[iI]>$/i.test(part)) {
            const inner = part.replace(/^<[iI]>/i, '').replace(/<\/[iI]>$/i, '');
            return (
                <em key={key} className="post-formatted-italic">
                    {parseInline(inner, `${key}-i`)}
                </em>
            );
        }

        // Safe plain text: React escapes this completely, preventing XSS
        return part;
    });
}

export function formatPostContent(content) {
    if (content === null || content === undefined) return null;
    const sanitized = sanitizeContent(String(content));

    // Normalize <br> or <br/> tags to linebreaks
    const normalized = sanitized.replace(/<br\s*\/?>/gi, '\n');
    const lines = normalized.split('\n');

    const elements = [];
    let quoteBuffer = [];

    const flushQuotes = (keyBase) => {
        if (quoteBuffer.length > 0) {
            elements.push(
                <blockquote key={`quote-${keyBase}`} className="post-blockquote">
                    {quoteBuffer.map((qLine, qIdx) => (
                        <div key={`qline-${keyBase}-${qIdx}`} className="post-quote-line">
                            {parseInline(qLine, `q-${keyBase}-${qIdx}`)}
                        </div>
                    ))}
                </blockquote>
            );
            quoteBuffer = [];
        }
    };

    lines.forEach((line, index) => {
        const quoteMatch = line.match(/^>\s?(.*)$/);
        if (quoteMatch) {
            quoteBuffer.push(quoteMatch[1]);
        } else {
            flushQuotes(index);
            if (line.trim() === '') {
                elements.push(<div key={`br-${index}`} className="post-line-break" />);
            } else {
                elements.push(
                    <div key={`line-${index}`} className="post-line">
                        {parseInline(line, `l-${index}`)}
                    </div>
                );
            }
        }
    });

    flushQuotes(lines.length);

    return elements;
}

class Post extends Component {
    constructor(props) {
        super(props);
        this.state = {
            commentContent: ''
        }
    }
    handleCommentChange = (e) => {
        this.setState({
            commentContent: e.target.value
        });
    }

    handleCreateComment = async () => {
        const { commentContent } = this.state;
        const url = APIUrls.createComment;
        const options = {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${getAuthTokenFromLocalStorage()}`
            },
            body: getFormBody({ content: commentContent, post_id: this.props.post._id })
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (data.success) {
            //dispatch data.data.comment, post._id wale post mai store
            this.props.dispatch(createComment(data.data.comment, this.props.post._id));
        }

        this.setState({
            commentContent: ''
        })
    }

    handlePostLikeClick = () => {
        const { post, user } = this.props;
        this.props.dispatch(addLike(post._id, 'Post', user._id));
    }

    render() {
        const { post, user } = this.props;

        const isPostLikedByUser = post.likes.includes(user._id); //true or false. Only valid when the user likes. After refresh this doesn't work

        return (
            <div className="post-wrapper">
                {/* Post wrapper divided into sections */}
                {/* header contains user avatar, name, the time when post was created */}
                <div className="post-header">
                    <Link to={`/user/${post.user._id}`} >
                        <img className="post-header-avatar" src="https://cdn-icons-png.flaticon.com/512/4333/4333609.png" alt="avatar" />
                        {/* when clicked redirect to API_ROOT/users/{post.user._id} */}
                    </Link>
                    <div>
                        <p>{post.user.name}</p>
                        <p className="text-mute">a minute ago</p>
                    </div>
                </div>
                {/* This contains the content of the post */}
                <div className="post-content">
                    {formatPostContent(post.content)}
                </div>
                {/* Actions: Like and comment */}
                <div className="post-actions">
                    {isPostLikedByUser ?
                        <img src="https://cdn-icons-png.flaticon.com/512/2107/2107845.png" alt="liked post" onClick={this.handlePostLikeClick} />
                        :
                        <img src="https://cdn-icons-png.flaticon.com/512/1077/1077035.png" alt="not liked post" onClick={this.handlePostLikeClick} />
                    }
                    <span>{post.likes.length}</span>
                    <img src="https://cdn-icons-png.flaticon.com/512/1380/1380338.png" alt="" />
                    <span>{post.comments.length}</span>
                </div>
                {/* Input box to comment on the post */}
                <div className="post-comment-box">
                    <input type="text" onChange={this.handleCommentChange} value={this.state.commentContent} placeholder="Comment..." />
                    <button onClick={this.handleCreateComment}>Comment</button>
                </div>
                {/* Area where comments will be displayed */}
                {/* Only show if length of comments array is greater than 0 */}
                {post.comments.length > 0 && <div className="post-comments-display">
                    {post.comments.map((comment) => {
                        return <Comment comment={comment} key={comment._id} />
                    })}
                </div>}
            </div>
        )
    }
}

Post.propTypes = {
    post: PropTypes.object.isRequired,
}

function mapStateToProps({ auth }) {
    return {
        user: auth.user
    }
}
export default connect(mapStateToProps)(Post);