import { APIUrls } from "../helpers/urls";
import { getAuthTokenFromLocalStorage } from "../helpers/utils";
import { ADD_COMMENT, ADD_POST, UPDATE_COMMENT_LIKE, UPDATE_POSTS, UPDATE_POST_LIKE } from "./actionTypes";

// Realistic fallback posts so feed displays visually when external sandbox is offline
export const OSHO_LIVE_POST = {
  _id: "live-post-osho-quote",
  content: "> **The greatest fear in the world** is the *opinion of others*.",
  user: {
    _id: "user-osho",
    name: "Osho"
  },
  likes: ["user-1"],
  comments: []
};

export const INITIAL_FALLBACK_POSTS = [
  {
    _id: "demo-post-1",
    content: "🚀 Welcome to Codeial Social Media! Excited to showcase this fullstack community platform with real-time posts, comments, likes, and friendships.",
    user: {
      _id: "user-1",
      name: "Neelesh (Author)"
    },
    likes: ["user-osho", "user-3"],
    comments: [
      {
        _id: "comment-1",
        content: "The UI looks super clean! Love the sunset gradient theme.",
        user: {
          _id: "user-osho",
          name: "Osho"
        },
        likes: ["user-1"]
      }
    ]
  },
  {
    _id: "demo-post-2",
    content: "Containerizing this frontend with Docker and preparing Kubernetes deployment manifests for scalable cloud hosting. 🐳 ☸️",
    user: {
      _id: "user-osho",
      name: "Osho"
    },
    likes: ["user-1"],
    comments: []
  },
  {
    _id: "demo-post-3",
    content: "Tip: You can search users from the top navbar and click on any user to visit their profile and connect!",
    user: {
      _id: "user-3",
      name: "Elon Bhadwa"
    },
    likes: [],
    comments: []
  }
];

//Action creators
export function fetchPosts() {
    return (dispatch) => {
        const hasAnimated = typeof window !== 'undefined' && sessionStorage.getItem('codeial_osho_post_animated') === 'true';
        const initialPosts = hasAnimated ? [OSHO_LIVE_POST, ...INITIAL_FALLBACK_POSTS] : INITIAL_FALLBACK_POSTS;
        // 1. Immediately dispatch fallback posts so feed is populated instantly
        dispatch(updatePosts(initialPosts));

        // 2. Strict 3.5 second timeout to check backend API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 3500);

        const url = APIUrls.fetchPosts();
        fetch(url, { signal: controller.signal })
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error("Sandbox backend offline");
                return response.json();
            })
            .then((data) => {
                if (data && data.data && Array.isArray(data.data.posts) && data.data.posts.length > 0) {
                    dispatch(updatePosts(data.data.posts));
                }
            })
            .catch(() => {
                // If API timed out (max 3.5s) or failed, fallback posts are already active
                clearTimeout(timeoutId);
            });
    }
}


function updatePosts(posts) {
    return {
        type: UPDATE_POSTS,
        posts
    }
}

export function addPost(post) {
    return {
        type: ADD_POST,
        post
    }
}

//Creating comment
export function createComment(comment, postId) {
    return {
        type: ADD_COMMENT,
        comment,
        postId
    }
}

//Likes
export function addLike(id, likeType, userId) {
    return (dispatch) => {
        const url = APIUrls.toggleLike(id, likeType);

        fetch(url, {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${getAuthTokenFromLocalStorage()}`,
            }
        })
            .then(response => response.json())
            .then((data) => {
                if (data.success) {
                    if (likeType === 'Post') {
                        dispatch(addPostLikeToStore(id, userId));
                    }
                    if (likeType === 'Comment') {
                        dispatch(addCommentLikeToStore(id, userId));
                    }
                    return;
                }
            })
    }
}

export function addPostLikeToStore(postId, userId) {
    return {
        type: UPDATE_POST_LIKE,
        postId,
        userId
    }
}
export function addCommentLikeToStore(commentId, userId) {
    return {
        type: UPDATE_COMMENT_LIKE,
        commentId,
        userId
    }
}