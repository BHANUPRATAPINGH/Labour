// Firebase Authentication Functions
class FirebaseAuthService {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
    }

    // 1. Phone Number Authentication (OTP)
    async sendOTP(phoneNumber) {
        try {
            // Format: +91XXXXXXXXXX
            const formattedPhone = `+91${phoneNumber}`;
            
            // Setup reCAPTCHA verifier
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber
                }
            });

            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await this.auth.signInWithPhoneNumber(formattedPhone, appVerifier);
            
            // Save confirmation result for later use
            window.confirmationResult = confirmationResult;
            
            return {
                success: true,
                message: 'OTP sent successfully'
            };
        } catch (error) {
            console.error('Error sending OTP:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 2. Verify OTP
    async verifyOTP(otpCode) {
        try {
            const confirmationResult = window.confirmationResult;
            const result = await confirmationResult.confirm(otpCode);
            
            // User signed in successfully
            const user = result.user;
            
            return {
                success: true,
                user: user
            };
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return {
                success: false,
                message: 'Invalid OTP'
            };
        }
    }

    // 3. Register New User (Save to Firestore)
    async registerUser(userData) {
        try {
            // Add timestamp
            userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            userData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            userData.isActive = true;
            
            // Save to Firestore
            const docRef = await this.db.collection('users').add(userData);
            
            console.log('User registered with ID:', docRef.id);
            
            return {
                success: true,
                userId: docRef.id,
                userData: userData
            };
        } catch (error) {
            console.error('Error registering user:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 4. Save Worker Profile
    async saveWorkerProfile(workerData, userId) {
        try {
            // Add user reference
            workerData.userId = userId;
            workerData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            
            // Save to workers collection
            const workerRef = await this.db.collection('workers').add(workerData);
            
            // Also update user document with worker reference
            await this.db.collection('users').doc(userId).update({
                workerId: workerRef.id,
                profileComplete: true
            });
            
            return {
                success: true,
                workerId: workerRef.id
            };
        } catch (error) {
            console.error('Error saving worker profile:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // 5. Check if user exists
    async checkUserExists(mobileNumber) {
        try {
            const snapshot = await this.db.collection('users')
                .where('mobile', '==', mobileNumber)
                .limit(1)
                .get();
            
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking user:', error);
            return false;
        }
    }
}

// Create global instance
const authService = new FirebaseAuthService();