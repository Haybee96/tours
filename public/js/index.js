
import '@babel/polyfill';
import { login, logout } from './login';
import { signup } from './signup';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM ELEMENTS
const loginForm = document.querySelector('.btn__signin');
const signupForm = document.querySelector('.btn__signup');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//DELEGATION

if (loginForm) 
    loginForm.addEventListener('click', e => {
        // Prevent the event default action
        e.preventDefault();
        // Change the button text immediately after the button has been clicked.
        loginForm.textContent = 'LOGGING IN...'
        // Get input value
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // log in the user with the credentials
        login(email, password);
    });


if (signupForm) 

    signupForm.addEventListener('click', e => {
        // Prevent the event default action
        e.preventDefault();
        // Change the button text immediately after the button has been clicked.
        signupForm.textContent = 'Processing...'
        // Get input value
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;

        // log in the user with the credentials
        signup(name, email, password, passwordConfirm);
    });

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (userDataForm) {
    userDataForm.addEventListener('submit', async e => {
        e.preventDefault();

        // Update the button text
        document.querySelector('.btn--save-settings').textContent = 'Updating...';

        // Create a new form data
        const form = new FormData();

        // Append form data that needs to be submitted
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
    
        await updateSettings(form, 'Data');

        // Reload the page
        window.setTimeout(() => {
            location.reload();
        }, 1500);

        // Update the button text
        document.querySelector('.btn--save-settings').textContent = 'Save Settings';
    });
}

if (userPasswordForm)
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();

        // Update the button text
        document.querySelector('.btn--save-password').textContent = 'Updating...';

        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        // Call the update settings function and pass in the elements
        await updateSettings({ passwordCurrent, password, passwordConfirm }, 'Password');

        // Update the button text
        document.querySelector('.btn--save-password').textContent = 'Save Password';

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });

if (bookBtn)
    bookBtn.addEventListener('click', e => {
        e.preventDefault();
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    });