import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
    // Provide the endpoint based on the type ('password' or 'data')
    // http://127.0.0.1:8000
    const url = type === 'Password' ? '/api/v1/users/update-my-password' : '/api/v1/users/update-me';

    try {
        const res = await axios({
            method: "PATCH",
            url,
            data,
        });

        if (res.data.status === 'success') {
            showAlert('success', `${type} updated successfully`);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
    
}