import React, { Component } from 'react'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { addLike } from '../actions/posts';
import { logUserActivity } from '../helpers/discordNotifier';
import './Comment.css';

class Comment extends Component {
    handleCommentLikeClick = () => {
        const { comment, user } = this.props;
        const commentAuthor = (comment && comment.user && comment.user.name) || 'User';
        logUserActivity(`Liked comment by ${commentAuthor}`);
        const userId = user ? user._id : undefined;
        this.props.dispatch(addLike(comment._id, 'Comment', userId));
    }
    render() {
        const { comment, user } = this.props;
        const commentAuthor = (comment && comment.user && comment.user.name) || 'User';
        const commentAuthorId = (comment && comment.user && (comment.user._id || comment.user)) || '';
        const isCommentLikedByUser = user && user._id && Array.isArray(comment.likes) ? comment.likes.includes(user._id) : false;
        const likesCount = Array.isArray(comment.likes) ? comment.likes.length : 0;

        return (
            <>
                <div className="post-comment">
                    <div className="post-comment-header">
                        <span>
                            <Link to={`/user/${commentAuthorId}`} onClick={() => logUserActivity(`Clicked comment author: ${commentAuthor}`)}>
                                {commentAuthor}
                            </Link>
                        </span>
                        <span className="text-mute">a minute ago</span>
                        <span>
                            {isCommentLikedByUser ?
                                <img src="https://cdn-icons-png.flaticon.com/512/2107/2107845.png" alt="" onClick={this.handleCommentLikeClick} />
                                :
                                <img src="https://cdn-icons-png.flaticon.com/512/1077/1077035.png" alt="" onClick={this.handleCommentLikeClick} />
                            }
                            {likesCount} likes
                        </span>
                    </div>
                    <div>{comment.content}</div>
                </div>
            </>
        )
    }
}

function mapStateToProps({ auth }) {
    return {
        user: auth.user
    }
}
export default connect(mapStateToProps)(Comment);