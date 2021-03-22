import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: 'POST',
            // url: 'http://127.0.0.1:8000/api/v1/users/signup',
            url: '/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm
            }
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Account successfully created. You can now log in');
            window.setTimeout(() => {
                location.assign('/login');
            }, 1500);
        }

    } catch (err) {
        showAlert('error', err.response.data.message);
        window.setTimeout(() => {
            location.reload();
        }, 1500);
    }
};