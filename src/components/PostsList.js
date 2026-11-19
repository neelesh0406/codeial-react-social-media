import React, { Component } from 'react';
import { connect } from 'react-redux';
import './PostsList.css';
import PropTypes from 'prop-types';
import { CreatePost } from '.';
import { Post } from './';
import { addPost } from '../actions/posts';

const REFERENCE_TYPING_USERS = ['Osho', 'Elon Bhadwa', 'Neelesh (Author)'];

class PostsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isCheckingAPI: true,
      isTyping: true,
      typingUser: 'Osho',
      sourceInfo: null,
    };
    this.apiTimer = null;
    this.typingInterval = null;
    this.typingHideTimer = null;
  }

  detectSource = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const rawSource = (
        urlParams.get('source') ||
        urlParams.get('ref') ||
        urlParams.get('utm_source') ||
        sessionStorage.getItem('codeial_ref_source') ||
        ''
      ).toLowerCase().trim();

      if (rawSource) {
        sessionStorage.setItem('codeial_ref_source', rawSource);
      }

      if (sessionStorage.getItem('codeial_source_dismissed') === 'true') {
        return;
      }

      if (!rawSource) return;

      let title = 'Recruiter';
      let message = "Welcome to Neelesh's Codeial portfolio showcase!";

      if (rawSource.includes('naukri')) {
        title = 'Naukri Hiring Team';
        message = "Welcome! Viewing Neelesh's live Codeial showcase from Naukri.";
      } else if (rawSource.includes('linkedin')) {
        title = 'LinkedIn Recruiter';
        message = "Welcome! Viewing Neelesh's live Codeial showcase from LinkedIn.";
      } else if (rawSource === 'resume1' || rawSource.includes('frontend')) {
        title = 'Frontend Hiring Team';
        message = "Welcome! Viewing Neelesh's live Codeial portfolio demo.";
      } else if (rawSource === 'resume2' || rawSource.includes('fullstack')) {
        title = 'Fullstack Hiring Team';
        message = "Welcome! Viewing Neelesh's live Codeial portfolio demo.";
      } else if (rawSource.includes('resume')) {
        title = 'Resume Visitor';
        message = "Welcome! Viewing Neelesh's live Codeial portfolio demo.";
      } else {
        title = `${rawSource.charAt(0).toUpperCase() + rawSource.slice(1)} Visitor`;
        message = "Welcome to Neelesh's live Codeial portfolio showcase!";
      }

      this.setState({
        sourceInfo: { title, message },
      });
    } catch (e) {}
  };

  dismissSourceBanner = () => {
    try {
      sessionStorage.setItem('codeial_source_dismissed', 'true');
    } catch (e) {}
    this.setState({ sourceInfo: null });
  };

  componentDidMount() {
    this.detectSource();

    // 3.5-second timer matching the max API check timeout
    this.apiTimer = setTimeout(() => {
      this.setState({
        isCheckingAPI: false,
        isTyping: false,
      });

      // Inject the newly typed post into the feed
      const newLivePost = {
        _id: 'live-post-' + Date.now(),
        content:
          '> **The greatest fear in the world** is the *opinion of others*.\n\nAnd the moment you are fearless you are no longer a sheep, you become a **lion** 🦁. A great roar arises in your heart, the *roar of freedom*! ✨',
        user: {
          _id: 'user-osho',
          name: 'Osho',
        },
        likes: [],
        comments: [],
      };

      if (this.props.dispatch) {
        this.props.dispatch(addPost(newLivePost));
      }

      // Play crisp, audible notification pop (handled gracefully if browser blocks autoplay)
      try {
        const chime = new Audio(
          'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3'
        );
        chime.volume = 0.5;
        chime.play().catch(() => {});
      } catch (err) {
        // Audio error ignored
      }

      // Trigger music playback simultaneously with mock post arrival
      try {
        window.dispatchEvent(new CustomEvent('codeial:play-music'));
      } catch (e) {}
    }, 3500);

    // Random user typing badge every ~6 seconds for a few seconds
    this.typingInterval = setInterval(() => {
      const randomUser =
        REFERENCE_TYPING_USERS[
          Math.floor(Math.random() * REFERENCE_TYPING_USERS.length)
        ];
      this.setState({
        isTyping: true,
        typingUser: randomUser,
      });

      if (this.typingHideTimer) {
        clearTimeout(this.typingHideTimer);
      }
      this.typingHideTimer = setTimeout(() => {
        this.setState({
          isTyping: false,
        });
      }, 2500);
    }, 6000);
  }

  componentWillUnmount() {
    if (this.apiTimer) {
      clearTimeout(this.apiTimer);
    }
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
    if (this.typingHideTimer) {
      clearTimeout(this.typingHideTimer);
    }
  }

  render() {
    const { posts, isLoggedin } = this.props;
    const { isCheckingAPI, isTyping, typingUser, sourceInfo } = this.state;

    return (
      <div className="posts-list">
        <h1>Posts</h1>

        {/* Recruiter / Reference Source Welcome Banner */}
        {sourceInfo && (
          <div className="recruiter-source-banner" role="status">
            <div className="recruiter-source-content">
              <span className="recruiter-source-badge">👋 {sourceInfo.title}</span>
              <span className="recruiter-source-text">{sourceInfo.message}</span>
            </div>
            <button
              className="recruiter-source-dismiss"
              onClick={this.dismissSourceBanner}
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading state badge - active only during check */}
        {isCheckingAPI && (
          <div className="feed-status-bar">
            <span className="feed-badge badge-checking">
              🔄 Syncing with Codeial Network...
            </span>
          </div>
        )}

        {/* Floating Typing Indicator hovering over UI (zero layout shift) */}
        {isTyping && (
          <div className="typing-banner" role="status" aria-live="polite">
            <span className="typing-avatar">✍️</span>
            <span className="typing-text">
              <strong>{typingUser}</strong> is typing a new post
            </span>
            <span className="typing-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}

        {/* Component for creating post */}
        {isLoggedin && <CreatePost />}

        {/* Fake & real posts shown immediately */}
        {posts.map((post) => {
          return <Post post={post} key={post._id} />;
        })}
      </div>
    );
  }
}

PostsList.propTypes = {
  posts: PropTypes.array.isRequired,
  isLoggedin: PropTypes.bool,
};

export default connect()(PostsList);