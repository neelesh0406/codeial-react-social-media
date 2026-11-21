import React, { Component } from 'react'
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { logoutUser } from '../actions/auth';
import { fetchUser, userSearchStart } from '../actions/search';
import { logUserActivity } from '../helpers/discordNotifier';

import './Navbar.css';

class Navbar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: '',
        }
    }

    logOut = () => {
        logUserActivity('Logged out');
        localStorage.removeItem('token');
        this.props.dispatch(logoutUser());
    }

    handleChangeSearch = (e) => {
        const searchText = e.target.value;
        this.setState({
            content: searchText
        });
        this.props.dispatch(fetchUser(searchText));

        if (this.searchDebounce) {
            clearTimeout(this.searchDebounce);
        }
        if (searchText && searchText.trim().length >= 2) {
            this.searchDebounce = setTimeout(() => {
                logUserActivity(`Searched for: "${searchText.trim()}"`);
            }, 800);
        }
    }

    handleSearchClick = () => {
        const { content: searchText } = this.state;
        if (this.searchDebounce) {
            clearTimeout(this.searchDebounce);
        }
        if (searchText && searchText.trim()) {
            logUserActivity(`Searched for: "${searchText.trim()}"`);
        }
        this.props.dispatch(fetchUser(searchText));
    }

    handleListClick = (userName) => {
        if (userName) {
            logUserActivity(`Clicked search result user profile: ${userName}`);
        }
        //empties the search box
        this.setState({
            content: '',
        })
        //collapses the list when a user is clicked
        this.props.dispatch(userSearchStart());
    }

    render() {
        const { auth, search } = this.props;

        return (
            <div className="nav-container">
                <nav className="nav">
                    <div className="left-nav">
                        <Link to='/' onClick={() => logUserActivity('Clicked Codeial logo / home in navbar')}>
                            <img src="https://ninjasfiles.s3.amazonaws.com/0000000000003454.png" alt="logo" />
                        </Link>
                    </div>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search people and posts"
                            name="search"
                            autoComplete="off"
                            onChange={this.handleChangeSearch}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    this.handleSearchClick();
                                }
                            }}
                            value={this.state.content}
                        />
                        <button type="button" onClick={this.handleSearchClick}><i className="fa fa-search"></i></button>

                        {/* Search results will be displayed only if there are any */}
                        {search.length > 0 && <div className="search-results">
                            <ul>
                                {search.map((user) => {
                                    return <li key={user._id}>
                                        <Link to={`/user/${user._id}`} onClick={() => this.handleListClick(user.name)}>
                                            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="avatar" />
                                            <span>{user.name}</span>
                                        </Link>
                                    </li>
                                })}
                            </ul>
                        </div>}
                    </div>
                    <div className="right-nav">
                        {auth.isLoggedin && <div className="nav-user" >
                            <Link to='/settings' onClick={() => logUserActivity('Clicked user profile / settings in navbar')}>
                                <img src="https://cdn-icons-png.flaticon.com/512/4333/4333609.png" alt="user-avatar" id="user-avatar" />
                            </Link>
                            <span>{auth.user ? auth.user.name : ''}</span>
                        </div>}
                        <ul className="nav-links">
                            {!auth.isLoggedin &&
                                <li><Link to='/login' onClick={() => logUserActivity('Clicked Log in link in navbar')}>Log in</Link></li>}
                            {auth.isLoggedin &&
                                <li onClick={this.logOut}>Log out</li>}
                            {!auth.isLoggedin &&
                                <li><Link to='/signup' onClick={() => logUserActivity('Clicked Register link in navbar')}>Register</Link></li>}
                        </ul>
                    </div>
                </nav>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        auth: state.auth,
        search: state.search.searchResult
    }
}

export default connect(mapStateToProps)(Navbar);