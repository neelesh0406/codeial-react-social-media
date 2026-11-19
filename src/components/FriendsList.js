import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchFriends } from '../actions/friends';
import './FriendsList.css';

// Exact people featured in the mock posts & live feed
const MOCK_CONNECTIONS = [
  {
    to_user: {
      _id: 'user-osho',
      name: 'Osho',
    },
  },
  {
    to_user: {
      _id: 'user-Elon',
      name: 'Elon Bhadwa',
    },
  },
  {
    to_user: {
      _id: 'user-1',
      name: 'Neelesh (Author)',
    },
  },
];

// Helper to truncate user name after 18 characters with ellipsis
const truncateName = (name, maxLength = 18) => {
  if (!name) return '';
  return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
};

class FriendsList extends Component {
  componentDidMount() {
    this.props.dispatch(fetchFriends());
  }

  render() {
    const { friends, isLoggedin } = this.props;
    const displayFriends = friends && friends.length > 0 ? friends : MOCK_CONNECTIONS;

    return (
      <div className="friends-list-container">
        <h1>Connections</h1>
        {!isLoggedin && (
          <div className="friends-login-prompt">
            <Link to="/login">Login</Link> to add friends
          </div>
        )}

        <div className="friends-list">
          {displayFriends.map((friend) => {
            return (
              <Link
                to={`/user/${friend.to_user._id}`}
                className="friend-wrapper"
                key={friend.to_user._id}
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/1674/1674291.png"
                  alt="avatar"
                />
                <span title={friend.to_user.name}>
                  {truncateName(friend.to_user.name, 18)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    friends: state.friends,
    isLoggedin: state.auth.isLoggedin,
  };
}

export default connect(mapStateToProps)(FriendsList);