
// type is 'success' or 'error'
export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
};

export const showAlert = (type, msg) => {
    // Always run the hideAlert() function when showAlert() function is called
    hideAlert();
    // Create a new markup for the alert
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    // Select where to display the alert using afterbegin
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

    // Hide alert after 5 seconds
    window.setTimeout(hideAlert, 5000);
};