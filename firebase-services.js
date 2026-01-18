// Firebase Services Module
// File: public/js/firebase-services.js

class FirebaseServices {
    constructor() {
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;
        this.storage = window.firebaseStorage;
        this.modules = window.firebaseModules;
        this.confirmationResult = null;
        
        console.log("Firebase Services initialized");
    }
    
    // ========== AUTHENTICATION ==========
    
    // Send OTP to phone number
    async sendOTP(phoneNumber) {
        try {
            const formattedPhone = `+91${phoneNumber}`;
            
            // Setup reCAPTCHA
            window.recaptchaVerifier = new this.modules.RecaptchaVerifier(
                'recaptcha-container', 
                {
                    'size': 'invisible',
                    'callback': () => {
                        console.log('reCAPTCHA solved');
                    }
                }
            );
            
            const appVerifier = window.recaptchaVerifier;
            
            // Send OTP
            this.confirmationResult = await this.modules.signInWithPhoneNumber(
                this.auth, 
                formattedPhone, 
                appVerifier
            );
            
            return {
                success: true,
                message: 'OTP sent successfully'
            };
            
        } catch (error) {
            console.error('Error sending OTP:', error);
            return {
                success: false,
                message: error.message,
                code: error.code
            };
        }
    }
    
    // Verify OTP
    async verifyOTP(otpCode) {
        try {
            if (!this.confirmationResult) {
                throw new Error('No OTP sent. Please send OTP first.');
            }
            
            const result = await this.confirmationResult.confirm(otpCode);
            const user = result.user;
            
            return {
                success: true,
                user: {
                    uid: user.uid,
                    phoneNumber: user.phoneNumber,
                    email: user.email,
                    displayName: user.displayName
                }
            };
            
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return {
                success: false,
                message: error.message,
                code: error.code
            };
        }
    }
    
    // Get current user
    getCurrentUser() {
        return this.auth.currentUser;
    }
    
    // Sign out
    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    // ========== FIRESTORE DATABASE ==========
    
    // Add a new user
    async addUser(userData) {
        try {
            const userRef = this.modules.collection(this.db, 'users');
            const docRef = await this.modules.addDoc(userRef, {
                ...userData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                isVerified: false,
                rating: 0,
                jobsCompleted: 0
            });
            
            console.log('User added with ID:', docRef.id);
            return {
                success: true,
                userId: docRef.id,
                userData: userData
            };
            
        } catch (error) {
            console.error('Error adding user:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Get user by mobile number
    async getUserByMobile(mobile) {
        try {
            const usersRef = this.modules.collection(this.db, 'users');
            const q = this.modules.query(
                usersRef, 
                this.modules.where('mobile', '==', mobile)
            );
            
            const querySnapshot = await this.modules.getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    success: true,
                    user: {
                        id: doc.id,
                        ...doc.data()
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            
        } catch (error) {
            console.error('Error getting user:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Update user profile
    async updateUser(userId, userData) {
        try {
            const userRef = this.modules.doc(this.db, 'users', userId);
            await this.modules.updateDoc(userRef, {
                ...userData,
                updatedAt: new Date().toISOString()
            });
            
            return {
                success: true,
                message: 'Profile updated successfully'
            };
            
        } catch (error) {
            console.error('Error updating user:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Add a worker (for professionals)
    async addWorker(workerData, professionalId) {
        try {
            const workersRef = this.modules.collection(this.db, 'workers');
            const docRef = await this.modules.addDoc(workersRef, {
                ...workerData,
                addedBy: professionalId,
                addedAt: new Date().toISOString(),
                isActive: true,
                isVerified: false,
                rating: 0,
                jobsCompleted: 0
            });
            
            // Update professional's worker count
            await this.updateProfessionalWorkerCount(professionalId);
            
            return {
                success: true,
                workerId: docRef.id,
                message: 'Worker added successfully'
            };
            
        } catch (error) {
            console.error('Error adding worker:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Update professional worker count
    async updateProfessionalWorkerCount(professionalId) {
        try {
            // Get current count
            const workersRef = this.modules.collection(this.db, 'workers');
            const q = this.modules.query(
                workersRef,
                this.modules.where('addedBy', '==', professionalId)
            );
            
            const querySnapshot = await this.modules.getDocs(q);
            const count = querySnapshot.size;
            
            // Update professional document
            const profRef = this.modules.doc(this.db, 'users', professionalId);
            await this.modules.updateDoc(profRef, {
                workersCount: count,
                updatedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error updating worker count:', error);
        }
    }
    
    // Get all workers
    async getAllWorkers(filters = {}) {
        try {
            let workersRef = this.modules.collection(this.db, 'workers');
            let queryConstraints = [];
            
            // Apply filters
            if (filters.area) {
                queryConstraints.push(this.modules.where('area', '==', filters.area));
            }
            
            if (filters.profession) {
                queryConstraints.push(this.modules.where('profession', '==', filters.profession));
            }
            
            if (filters.isActive !== undefined) {
                queryConstraints.push(this.modules.where('isActive', '==', filters.isActive));
            }
            
            // Create query
            let q;
            if (queryConstraints.length > 0) {
                q = this.modules.query(workersRef, ...queryConstraints);
            } else {
                q = this.modules.query(workersRef);
            }
            
            const querySnapshot = await this.modules.getDocs(q);
            const workers = [];
            
            querySnapshot.forEach((doc) => {
                workers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return {
                success: true,
                workers: workers,
                count: workers.length
            };
            
        } catch (error) {
            console.error('Error getting workers:', error);
            return {
                success: false,
                workers: [],
                count: 0,
                message: error.message
            };
        }
    }
    
    // Get workers by professional
    async getWorkersByProfessional(professionalId) {
        try {
            const workersRef = this.modules.collection(this.db, 'workers');
            const q = this.modules.query(
                workersRef,
                this.modules.where('addedBy', '==', professionalId)
            );
            
            const querySnapshot = await this.modules.getDocs(q);
            const workers = [];
            
            querySnapshot.forEach((doc) => {
                workers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return {
                success: true,
                workers: workers,
                count: workers.length
            };
            
        } catch (error) {
            console.error('Error getting workers:', error);
            return {
                success: false,
                workers: [],
                message: error.message
            };
        }
    }
    
    // Get worker by ID
    async getWorkerById(workerId) {
        try {
            const workerRef = this.modules.doc(this.db, 'workers', workerId);
            // In Firestore v10, we need to use getDoc
            const doc = await workerRef.get();
            
            if (doc.exists()) {
                return {
                    success: true,
                    worker: {
                        id: doc.id,
                        ...doc.data()
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'Worker not found'
                };
            }
            
        } catch (error) {
            console.error('Error getting worker:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Update worker
    async updateWorker(workerId, workerData) {
        try {
            const workerRef = this.modules.doc(this.db, 'workers', workerId);
            await this.modules.updateDoc(workerRef, {
                ...workerData,
                updatedAt: new Date().toISOString()
            });
            
            return {
                success: true,
                message: 'Worker updated successfully'
            };
            
        } catch (error) {
            console.error('Error updating worker:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Delete worker
    async deleteWorker(workerId) {
        try {
            // Note: In Firestore, we typically mark as inactive instead of deleting
            const workerRef = this.modules.doc(this.db, 'workers', workerId);
            await this.modules.updateDoc(workerRef, {
                isActive: false,
                updatedAt: new Date().toISOString()
            });
            
            return {
                success: true,
                message: 'Worker deleted successfully'
            };
            
        } catch (error) {
            console.error('Error deleting worker:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // ========== STORAGE ==========
    
    // Upload profile picture
    async uploadProfilePicture(file, userId) {
        try {
            const storageRef = this.modules.ref(this.storage, `profile-pictures/${userId}`);
            const snapshot = await this.modules.uploadBytes(storageRef, file);
            const downloadURL = await this.modules.getDownloadURL(snapshot.ref);
            
            return {
                success: true,
                url: downloadURL
            };
            
        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // ========== AREA & PROFESSION MANAGEMENT ==========
    
    // Update area collection
    async updateAreaCollection(areaName) {
        try {
            // Create area slug
            const areaSlug = areaName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const areaRef = this.modules.doc(this.db, 'areas', areaSlug);
            
            await this.modules.setDoc(areaRef, {
                name: areaName,
                updatedAt: new Date().toISOString(),
                workerCount: this.modules.increment ? this.modules.increment(1) : 1
            }, { merge: true });
            
            return { success: true };
            
        } catch (error) {
            console.error('Error updating area:', error);
            return { success: false };
        }
    }
    
    // Update profession collection
    async updateProfessionCollection(professionName) {
        try {
            const professionRef = this.modules.doc(this.db, 'professions', professionName);
            
            await this.modules.setDoc(professionRef, {
                name: this.getProfessionDisplayName(professionName),
                updatedAt: new Date().toISOString(),
                workerCount: this.modules.increment ? this.modules.increment(1) : 1
            }, { merge: true });
            
            return { success: true };
            
        } catch (error) {
            console.error('Error updating profession:', error);
            return { success: false };
        }
    }
    
    // Get all areas
    async getAllAreas() {
        try {
            const areasRef = this.modules.collection(this.db, 'areas');
            const querySnapshot = await this.modules.getDocs(areasRef);
            const areas = [];
            
            querySnapshot.forEach((doc) => {
                areas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return areas.sort((a, b) => b.workerCount - a.workerCount);
            
        } catch (error) {
            console.error('Error getting areas:', error);
            return [];
        }
    }
    
    // Get all professions
    async getAllProfessions() {
        try {
            const professionsRef = this.modules.collection(this.db, 'professions');
            const querySnapshot = await this.modules.getDocs(professionsRef);
            const professions = [];
            
            querySnapshot.forEach((doc) => {
                professions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return professions.sort((a, b) => b.workerCount - a.workerCount);
            
        } catch (error) {
            console.error('Error getting professions:', error);
            return [];
        }
    }
    
    // Helper function
    getProfessionDisplayName(professionCode) {
        const professions = {
            'mason': 'Mason (Mistri)',
            'electrician': 'Electrician',
            'plumber': 'Plumber',
            'painter': 'Painter',
            'carpenter': 'Carpenter',
            'welder': 'Welder',
            'driver': 'Driver',
            'helper': 'Helper',
            'cleaner': 'Cleaner',
            'other': 'Other'
        };
        return professions[professionCode] || professionCode;
    }
}

// Create global instance
window.firebaseService = new FirebaseServices();