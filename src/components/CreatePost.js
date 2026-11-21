import React, { Component } from 'react'
import { connect } from 'react-redux';
import { APIUrls } from '../helpers/urls';
import { getAuthTokenFromLocalStorage, getFormBody } from '../helpers/utils';
import { addPost } from '../actions/posts';
import { logUserActivity } from '../helpers/discordNotifier';
import './CreatePost.css';

class CreatePost extends Component {
    constructor(props) {
        super(props)
        this.state = {
            text: ''
        }
        this.textareaRef = React.createRef();
    }
    handlePostText = (e) => {
        this.setState({
            text: e.target.value
        })
    }

    applyFormatting = (syntax) => {
        logUserActivity(`Used post toolbar: ${syntax}`);
        const textarea = this.textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = this.state.text;
        const selectedText = text.substring(start, end);

        let replacement = '';
        let selectStart = start;
        let selectEnd = start;

        if (syntax === 'bold') {
            if (selectedText) {
                replacement = `**${selectedText}**`;
                selectStart = start + replacement.length;
                selectEnd = selectStart;
            } else {
                replacement = '**bold text**';
                selectStart = start + 2;
                selectEnd = start + 11;
            }
        } else if (syntax === 'italic') {
            if (selectedText) {
                replacement = `*${selectedText}*`;
                selectStart = start + replacement.length;
                selectEnd = selectStart;
            } else {
                replacement = '*italic text*';
                selectStart = start + 1;
                selectEnd = start + 12;
            }
        } else if (syntax === 'quote') {
            const isLineStart = start === 0 || text[start - 1] === '\n';
            const prefix = isLineStart ? '> ' : '\n> ';
            if (selectedText) {
                replacement = prefix + selectedText.split('\n').join('\n> ');
                selectStart = start + replacement.length;
                selectEnd = selectStart;
            } else {
                replacement = `${prefix}quote here`;
                selectStart = start + prefix.length;
                selectEnd = selectStart + 10;
            }
        }

        const newText = text.substring(0, start) + replacement + text.substring(end);
        this.setState({ text: newText }, () => {
            textarea.focus();
            textarea.setSelectionRange(selectStart, selectEnd);
        });
    }

    handleAddPost = async () => {
        const { text } = this.state;
        logUserActivity('Submitted new post');
        const url = APIUrls.createPost;
        const options = {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${getAuthTokenFromLocalStorage()}`
            },
            body: getFormBody({ content: text })
        }

        const response = await fetch(url, options);
        const data = await response.json();

        if (data.success) {
            //dispatch post data and concat to posts array for displaying
            this.props.dispatch(addPost(data.data.post))
        }
        //sets the text area to '' after posting
        this.setState({
            text: ''
        })
    }

    render() {
        const { currentUser } = this.props;
        return (
            <div className="create-post">
                <div id="create-post-user-text">
                    <div className="create-post-user-info">
                        <img src="https://cdn-icons-png.flaticon.com/512/4333/4333609.png" alt="avatar" />
                        <p>{currentUser.name}</p>
                    </div>
                    <div className="create-post-input-container">
                        <div className="create-post-format-toolbar">
                            <button
                                type="button"
                                className="format-btn format-btn-bold"
                                title="Bold (**text**)"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => this.applyFormatting('bold')}
                            >
                                <strong>B</strong>
                            </button>
                            <button
                                type="button"
                                className="format-btn format-btn-italic"
                                title="Italic (*text*)"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => this.applyFormatting('italic')}
                            >
                                <em>I</em>
                            </button>
                            <button
                                type="button"
                                className="format-btn format-btn-quote"
                                title="Quote (> quote)"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => this.applyFormatting('quote')}
                            >
                                ❝
                            </button>
                        </div>
                        <textarea
                            ref={this.textareaRef}
                            onChange={this.handlePostText}
                            value={this.state.text}
                            id="create-post-text"
                            cols="30"
                            rows="3"
                            placeholder="What's on your mind? (**bold**, *italic*, > quote)"
                        />
                    </div>
                </div>
                <button onClick={this.handleAddPost} id="create-post-btn">Add post</button>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        currentUser: state.auth.user
    }
}
export default connect(mapStateToProps)(CreatePost);
