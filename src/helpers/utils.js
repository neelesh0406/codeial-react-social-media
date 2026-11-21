//Function to convert params to post request body like .../login?email=a@example.com&password=1234
export function getFormBody(params) {
    let formBody = [];

    for (let property in params) {
        let encodedKey = encodeURIComponent(property); // 'user name' => 'user%20name'
        let encodedValue = encodeURIComponent(params[property]); //neelesh 123 => neelesh%20123

        formBody.push(encodedKey + '=' + encodedValue);
    }

    return formBody.join('&');  //user%20name=N@example.com&password=1234
}

export function getAuthTokenFromLocalStorage() {
    return localStorage.getItem('token');
}

export const OSHO_AVATAR = 'https://i.pinimg.com/736x/fe/f5/a8/fef5a81dd5c4eeb131e6319c9cc5d3df.jpg';

export function getUserAvatar(name) {
    if (!name) return 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png';
    const lower = name.toLowerCase();
    if (lower.includes('osho')) {
        return OSHO_AVATAR;
    }
    if (lower.includes('elon')) {
        return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    }
    if (lower.includes('neelesh') || lower.includes('author')) {
        return 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png';
    }
    return 'https://cdn-icons-png.flaticon.com/512/4333/4333609.png';
}