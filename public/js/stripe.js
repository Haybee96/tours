import axios from 'axios';
import { showAlert } from './alerts';

// Create a stripe object and pass the public key
const stripe = Stripe('pk_test_51IRuzJFXGWM4Ucvucr864UZXZXF6B7kInRTW7snAKIY1gSDRYY6s9IicE8X27ON2NRGPKyE0O1LJQ4SYzW6YRMTi00CUvTbwZI');

// Book tour function
export const bookTour = async tourId => {

    try {
        // Get checkout session from API
        // http://127.0.0.1:8000
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    
        // Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    }
        
    catch (err) {
        console.log(err);
        showAlert('error', err);
    }
        
};