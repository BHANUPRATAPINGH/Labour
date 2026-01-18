// Labour Hiring Website - Main Application
// File: public/js/script.js

class LabourHiringApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.firebaseService = window.firebaseService;
        this.init();
    }

    init() {
        console.log('LabourHiringApp initializing...');
        
        // Check if user is logged in
        this.checkAuthState();
        
        // Load initial page
        setTimeout(() => {
            this.loadPage('home');
        }, 100);
        
        // Setup event listeners
        this.setupEventListeners();
    }

    checkAuthState() {
        // Check localStorage first
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                console.log('User found in localStorage:', this.currentUser.fullName);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // Check Firebase auth state
        if (this.firebaseService && this.firebaseService.auth) {
            this.firebaseService.auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('Firebase user authenticated:', user.uid);
                    // Sync Firebase user with local user
                    this.syncUserWithFirebase(user);
                }
            });
        }
    }

    async syncUserWithFirebase(firebaseUser) {
        try {
            // Get user data from Firestore
            const phone = firebaseUser.phoneNumber.replace('+91', '');
            const result = await this.firebaseService.getUserByMobile(phone);
            
            if (result.success && result.user) {
                this.currentUser = {
                    id: result.user.id,
                    ...result.user
                };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.updateNavigation();
            }
        } catch (error) {
            console.error('Error syncing user:', error);
        }
    }

    loadPage(page) {
        this.currentPage = page;
        const app = document.getElementById('app');
        const initialLoader = document.getElementById('initialLoader');
        
        // Hide initial loader
        if (initialLoader) {
            initialLoader.style.display = 'none';
        }
        
        // Show page loader briefly
        app.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Loading ${page.replace('-', ' ')}...</p>
            </div>
        `;
        
        // Load page content
        setTimeout(() => {
            this.renderPage(page);
        }, 50);
    }

    renderPage(page) {
        const app = document.getElementById('app');
        
        switch(page) {
            case 'home':
                app.innerHTML = this.getHomePage();
                break;
            case 'registration':
                app.innerHTML = this.getRegistrationPage();
                this.setupRegistrationForm();
                break;
            case 'login':
                app.innerHTML = this.getLoginPage();
                this.setupLoginForm();
                break;
            case 'find-workers':
                app.innerHTML = this.getFindWorkersPage();
                this.loadWorkers();
                break;
            case 'worker-dashboard':
                app.innerHTML = this.getWorkerDashboard();
                this.loadWorkerDashboard();
                break;
            case 'professional-dashboard':
                app.innerHTML = this.getProfessionalDashboard();
                this.loadProfessionalDashboard();
                break;
            case 'profile':
                app.innerHTML = this.getProfilePage();
                this.loadProfile();
                break;
            case 'map-view':
                app.innerHTML = this.getMapPage();
                this.loadMap();
                break;
            case 'payment':
                app.innerHTML = this.getPaymentPage();
                break;
            default:
                app.innerHTML = this.getHomePage();
        }
        
        // Update navigation
        this.updateNavigation();
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    updateNavigation() {
        const navContainer = document.getElementById('mainNav');
        if (!navContainer) return;
        
        const isLoggedIn = !!this.currentUser;
        
        let navHTML = '';
        
        if (isLoggedIn) {
            navHTML = `
                <li class="nav-item">
                    <a class="nav-link ${this.currentPage === 'home' ? 'active' : ''}" 
                       href="#" onclick="app.loadPage('home')">
                       <i class="bi bi-house"></i> Home
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${this.currentPage === 'find-workers' ? 'active' : ''}" 
                       href="#" onclick="app.loadPage('find-workers')">
                       <i class="bi bi-search"></i> Find Workers
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${this.currentPage === 'map-view' ? 'active' : ''}" 
                       href="#" onclick="app.loadPage('map-view')">
                       <i class="bi bi-map"></i> Map View
                    </a>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" 
                       role="button" data-bs-toggle="dropdown">
                       <i class="bi bi-person-circle"></i> ${this.currentUser.fullName?.split(' ')[0] || 'Profile'}
                    </a>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="#" onclick="app.loadPage('profile')">
                                <i class="bi bi-person"></i> My Profile
                            </a>
                        </li>
                        ${this.currentUser.userType === 'professional' ? `
                            <li>
                                <a class="dropdown-item" href="#" onclick="app.loadPage('professional-dashboard')">
                                    <i class="bi bi-people"></i> My Workers
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="app.loadPage('payment')">
                                    <i class="bi bi-credit-card"></i> Payment
                                </a>
                            </li>
                        ` : ''}
                        ${this.currentUser.userType === 'worker' ? `
                            <li>
                                <a class="dropdown-item" href="#" onclick="app.loadPage('worker-dashboard')">
                                    <i class="bi bi-briefcase"></i> Dashboard
                                </a>
                            </li>
                        ` : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item text-danger" href="#" onclick="app.logout()">
                                <i class="bi bi-box-arrow-right"></i> Logout
                            </a>
                        </li>
                    </ul>
                </li>
            `;
        } else {
            navHTML = `
                <li class="nav-item">
                    <a class="nav-link ${this.currentPage === 'home' ? 'active' : ''}" 
                       href="#" onclick="app.loadPage('home')">
                       Home
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${this.currentPage === 'find-workers' ? 'active' : ''}" 
                       href="#" onclick="app.loadPage('find-workers')">
                       Find Workers
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${this.currentPage === 'registration' ? 'active' : ''}" 
                       href="#" onclick="app.loadPage('registration')">
                       Register
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${this.currentPage === 'login' ? 'active' : ''}" 
                       href="#" onclick="app.loadPage('login')">
                       Login
                    </a>
                </li>
            `;
        }
        
        navContainer.innerHTML = navHTML;
    }

    getHomePage() {
        return `
            <div class="home-page">
                <!-- Hero Section -->
                <div class="hero-section bg-primary text-white py-5 mb-4 rounded">
                    <div class="container">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h1 class="display-5 fw-bold mb-3">Find Skilled Workers Near You</h1>
                                <p class="lead mb-4">Connect with verified masons, electricians, plumbers, painters and more in your area.</p>
                                <div class="d-flex flex-wrap gap-3">
                                    <button class="btn btn-light btn-lg" onclick="app.loadPage('find-workers')">
                                        <i class="bi bi-search"></i> Find Workers
                                    </button>
                                    <button class="btn btn-outline-light btn-lg" onclick="app.loadPage('registration')">
                                        <i class="bi bi-person-plus"></i> Register Free
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6 text-center">
                                <img src="https://cdn-icons-png.flaticon.com/512/3067/3067256.png" 
                                     alt="Workers" class="img-fluid" style="max-height: 250px;">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="container mb-5">
                    <div class="row g-3">
                        <div class="col-md-3 col-6">
                            <div class="card text-center border-0 shadow-sm h-100">
                                <div class="card-body py-4">
                                    <h2 class="text-primary mb-2" id="totalWorkersCount">0</h2>
                                    <p class="text-muted mb-0">Workers Registered</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="card text-center border-0 shadow-sm h-100">
                                <div class="card-body py-4">
                                    <h2 class="text-success mb-2" id="totalAreasCount">0</h2>
                                    <p class="text-muted mb-0">Cities Covered</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="card text-center border-0 shadow-sm h-100">
                                <div class="card-body py-4">
                                    <h2 class="text-info mb-2" id="totalJobsCount">0</h2>
                                    <p class="text-muted mb-0">Jobs Completed</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="card text-center border-0 shadow-sm h-100">
                                <div class="card-body py-4">
                                    <h2 class="text-warning mb-2" id="avgRating">0.0</h2>
                                    <p class="text-muted mb-0">Avg. Rating</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- How It Works -->
                <div class="container mb-5">
                    <h2 class="text-center mb-4">How LabourConnect Works</h2>
                    <div class="row g-4">
                        <div class="col-md-4">
                            <div class="card h-100 text-center border-0 shadow-sm">
                                <div class="card-body">
                                    <div class="step-number mb-3">
                                        <span class="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" 
                                              style="width: 50px; height: 50px;">1</span>
                                    </div>
                                    <h4 class="card-title">Register Profile</h4>
                                    <p class="card-text">Sign up as a worker or professional. Add your skills, experience, and location.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100 text-center border-0 shadow-sm">
                                <div class="card-body">
                                    <div class="step-number mb-3">
                                        <span class="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" 
                                              style="width: 50px; height: 50px;">2</span>
                                    </div>
                                    <h4 class="card-title">Get Discovered</h4>
                                    <p class="card-text">Customers find you by location and profession. View your profile and ratings.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100 text-center border-0 shadow-sm">
                                <div class="card-body">
                                    <div class="step-number mb-3">
                                        <span class="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" 
                                              style="width: 50px; height: 50px;">3</span>
                                    </div>
                                    <h4 class="card-title">Start Working</h4>
                                    <p class="card-text">Receive job requests, discuss details, and get paid for your work.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Popular Professions -->
                <div class="container mb-5">
                    <h2 class="text-center mb-4">Popular Professions</h2>
                    <div class="row g-3" id="professionsList">
                        <!-- Loaded dynamically -->
                    </div>
                </div>

                <!-- CTA Section -->
                <div class="container">
                    <div class="card bg-light border-0">
                        <div class="card-body text-center p-5">
                            <h3 class="mb-3">Ready to Get Started?</h3>
                            <p class="lead mb-4">Join thousands of workers and customers already using LabourConnect</p>
                            <div class="d-flex flex-wrap gap-3 justify-content-center">
                                <button class="btn btn-primary btn-lg px-4" onclick="app.loadPage('registration')">
                                    <i class="bi bi-person-plus"></i> Register Now
                                </button>
                                <button class="btn btn-outline-primary btn-lg px-4" onclick="app.loadPage('login')">
                                    <i class="bi bi-box-arrow-in-right"></i> Login
                                </button>
                                <button class="btn btn-success btn-lg px-4" onclick="app.demoLogin('worker')">
                                    <i class="bi bi-play-circle"></i> Try Demo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getRegistrationPage() {
        return `
            <div class="registration-page">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <div class="card border-0 shadow">
                                <div class="card-header bg-primary text-white">
                                    <h3 class="mb-0 text-center"><i class="bi bi-person-plus"></i> Create Account</h3>
                                </div>
                                <div class="card-body p-4">
                                    <!-- Role Selection -->
                                    <div class="text-center mb-4">
                                        <h5>Select Your Role</h5>
                                        <p class="text-muted">Choose how you want to use LabourConnect</p>
                                    </div>
                                    
                                    <div class="row mb-4">
                                        <div class="col-md-4 mb-3">
                                            <div class="card role-card text-center h-100" onclick="app.selectRole('worker')">
                                                <div class="card-body">
                                                    <div class="role-icon mb-3">
                                                        <i class="bi bi-person-badge" style="font-size: 2.5rem; color: #2E86AB;"></i>
                                                    </div>
                                                    <h5 class="card-title">👷 Worker</h5>
                                                    <p class="card-text small">Individual worker looking for jobs</p>
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="radio" name="userType" id="workerRole" value="worker" checked>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <div class="card role-card text-center h-100" onclick="app.selectRole('professional')">
                                                <div class="card-body">
                                                    <div class="role-icon mb-3">
                                                        <i class="bi bi-people" style="font-size: 2.5rem; color: #A23B72;"></i>
                                                    </div>
                                                    <h5 class="card-title">👥 Professional</h5>
                                                    <p class="card-text small">Contractor with multiple workers</p>
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="radio" name="userType" id="professionalRole" value="professional">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <div class="card role-card text-center h-100" onclick="app.selectRole('customer')">
                                                <div class="card-body">
                                                    <div class="role-icon mb-3">
                                                        <i class="bi bi-person-check" style="font-size: 2.5rem; color: #28a745;"></i>
                                                    </div>
                                                    <h5 class="card-title">👨‍💼 Customer</h5>
                                                    <p class="card-text small">Looking to hire workers</p>
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="radio" name="userType" id="customerRole" value="customer">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Registration Form -->
                                    <form id="registrationForm">
                                        <div class="basic-info-section mb-4">
                                            <h5 class="mb-3">Basic Information</h5>
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Full Name *</label>
                                                    <input type="text" class="form-control" id="fullName" required>
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Mobile Number *</label>
                                                    <input type="tel" class="form-control" id="mobile" 
                                                           pattern="[6-9][0-9]{9}" required>
                                                    <small class="text-muted">10-digit Indian number</small>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Worker Specific Fields -->
                                        <div id="workerFields" class="mb-4">
                                            <h5 class="mb-3">Professional Details</h5>
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Profession *</label>
                                                    <select class="form-select" id="profession" required>
                                                        <option value="">Select Profession</option>
                                                        <option value="mason">Mason (Mistri)</option>
                                                        <option value="electrician">Electrician</option>
                                                        <option value="plumber">Plumber</option>
                                                        <option value="painter">Painter</option>
                                                        <option value="carpenter">Carpenter</option>
                                                        <option value="welder">Welder</option>
                                                        <option value="driver">Driver</option>
                                                        <option value="cleaner">Cleaner</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Experience</label>
                                                    <select class="form-select" id="experience">
                                                        <option value="">Select Experience</option>
                                                        <option value="0-1">0-1 Years</option>
                                                        <option value="1-3">1-3 Years</option>
                                                        <option value="3-5">3-5 Years</option>
                                                        <option value="5-10">5-10 Years</option>
                                                        <option value="10+">10+ Years</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Daily Rate (₹)</label>
                                                    <input type="number" class="form-control" id="dailyRate" value="800" min="500" max="5000">
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Age</label>
                                                    <input type="number" class="form-control" id="age" min="18" max="70">
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Skills</label>
                                                <textarea class="form-control" id="skills" rows="2" placeholder="Describe your skills"></textarea>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Complete Address *</label>
                                                <textarea class="form-control" id="address" rows="3" required></textarea>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Area / Location *</label>
                                                    <input type="text" class="form-control" id="area" required>
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Pincode</label>
                                                    <input type="text" class="form-control" id="pincode" pattern="[0-9]{6}">
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Terms -->
                                        <div class="mb-4">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="terms" required>
                                                <label class="form-check-label" for="terms">
                                                    I agree to the <a href="#" onclick="app.showTerms()">Terms and Conditions</a>
                                                </label>
                                            </div>
                                        </div>

                                        <!-- Submit -->
                                        <div class="d-grid gap-2">
                                            <button type="submit" class="btn btn-primary btn-lg">
                                                <i class="bi bi-check-circle"></i> Create Account
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary" onclick="app.loadPage('home')">
                                                Back to Home
                                            </button>
                                        </div>
                                    </form>

                                    <div class="text-center mt-4">
                                        <p>Already have an account? <a href="#" onclick="app.loadPage('login')">Login here</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getLoginPage() {
        return `
            <div class="login-page">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-md-6 col-lg-5">
                            <div class="card border-0 shadow">
                                <div class="card-header bg-primary text-white text-center py-3">
                                    <h3 class="mb-0"><i class="bi bi-box-arrow-in-right"></i> Login</h3>
                                </div>
                                <div class="card-body p-4">
                                    <div class="text-center mb-4">
                                        <img src="https://cdn-icons-png.flaticon.com/512/3067/3067256.png" 
                                             alt="Login" class="img-fluid mb-3" style="max-height: 100px;">
                                        <p class="text-muted">Login with your mobile number</p>
                                    </div>
                                    
                                    <form id="loginForm">
                                        <div class="mb-4">
                                            <label class="form-label">Mobile Number</label>
                                            <div class="input-group">
                                                <span class="input-group-text">+91</span>
                                                <input type="tel" class="form-control" id="loginMobile" 
                                                       pattern="[6-9][0-9]{9}" placeholder="9876543210" required>
                                                <button type="button" class="btn btn-outline-primary" id="sendOTPBtn" onclick="app.sendOTP()">
                                                    Send OTP
                                                </button>
                                            </div>
                                            <small class="text-muted">10-digit Indian mobile number</small>
                                        </div>
                                        
                                        <div class="mb-4" id="otpSection" style="display: none;">
                                            <label class="form-label">Enter OTP</label>
                                            <div class="input-group">
                                                <input type="text" class="form-control" id="otp" 
                                                       placeholder="Enter 6-digit OTP" pattern="[0-9]{6}" required>
                                                <button type="button" class="btn btn-outline-success" onclick="app.resendOTP()">
                                                    Resend
                                                </button>
                                            </div>
                                            <small class="text-muted" id="otpTimer"></small>
                                        </div>
                                        
                                        <div class="d-grid mb-3">
                                            <button type="submit" class="btn btn-primary btn-lg" id="loginBtn">
                                                <i class="bi bi-unlock"></i> Login
                                            </button>
                                        </div>
                                        
                                        <div class="text-center">
                                            <p class="mb-2">New user? <a href="#" onclick="app.loadPage('registration')">Create account</a></p>
                                            <p class="mb-0 small text-muted">By continuing, you agree to our Terms & Privacy</p>
                                        </div>
                                    </form>
                                    
                                    <!-- Demo Login -->
                                    <div class="mt-4 pt-3 border-top">
                                        <p class="text-muted small text-center mb-2">For testing/demo:</p>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-secondary btn-sm" onclick="app.demoLogin('worker')">
                                                Demo: Worker Login
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm" onclick="app.demoLogin('customer')">
                                                Demo: Customer Login
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getFindWorkersPage() {
        return `
            <div class="find-workers-page">
                <div class="container-fluid">
                    <div class="row">
                        <!-- Search Filters -->
                        <div class="col-lg-3 col-md-4">
                            <div class="card sticky-top" style="top: 20px;">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="bi bi-filter"></i> Search Filters</h5>
                                </div>
                                <div class="card-body">
                                    <form id="searchForm">
                                        <div class="mb-3">
                                            <label class="form-label">Location</label>
                                            <input type="text" class="form-control" id="searchArea" placeholder="Enter area">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Profession</label>
                                            <select class="form-select" id="searchProfession">
                                                <option value="">All Professions</option>
                                                <option value="mason">Mason</option>
                                                <option value="electrician">Electrician</option>
                                                <option value="plumber">Plumber</option>
                                                <option value="painter">Painter</option>
                                                <option value="carpenter">Carpenter</option>
                                                <option value="welder">Welder</option>
                                                <option value="driver">Driver</option>
                                                <option value="cleaner">Cleaner</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Experience</label>
                                            <select class="form-select" id="searchExperience">
                                                <option value="">Any Experience</option>
                                                <option value="0-1">0-1 Years</option>
                                                <option value="1-3">1-3 Years</option>
                                                <option value="3-5">3-5 Years</option>
                                                <option value="5-10">5-10 Years</option>
                                                <option value="10+">10+ Years</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Daily Rate (₹)</label>
                                            <div class="row g-2">
                                                <div class="col">
                                                    <input type="number" class="form-control" id="minRate" placeholder="Min" min="0">
                                                </div>
                                                <div class="col">
                                                    <input type="number" class="form-control" id="maxRate" placeholder="Max" min="0">
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="mb-3 form-check">
                                            <input type="checkbox" class="form-check-input" id="verifiedOnly">
                                            <label class="form-check-label">Verified Workers Only</label>
                                        </div>
                                        
                                        <div class="d-grid gap-2">
                                            <button type="submit" class="btn btn-primary">
                                                <i class="bi bi-search"></i> Search Workers
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary" onclick="app.resetSearch()">
                                                Clear Filters
                                            </button>
                                        </div>
                                    </form>
                                    
                                    <!-- Quick Areas -->
                                    <div class="mt-4 pt-3 border-top">
                                        <h6 class="mb-2">Popular Areas:</h6>
                                        <div class="d-flex flex-wrap gap-2" id="popularAreas">
                                            <!-- Loaded dynamically -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Results -->
                        <div class="col-lg-9 col-md-8">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h3>Available Workers</h3>
                                    <p class="text-muted mb-0" id="resultsCount">Loading workers...</p>
                                </div>
                                <div>
                                    <button class="btn btn-outline-primary" onclick="app.loadPage('map-view')">
                                        <i class="bi bi-map"></i> View on Map
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Workers Grid -->
                            <div class="row g-3" id="workersGrid">
                                <div class="col-12 text-center py-5">
                                    <div class="spinner-border text-primary"></div>
                                    <p class="mt-2">Loading workers...</p>
                                </div>
                            </div>
                            
                            <!-- No Results -->
                            <div id="noResults" class="text-center py-5" style="display: none;">
                                <div class="alert alert-info">
                                    <h5>No workers found</h5>
                                    <p>Try changing your search criteria or register as a worker in your area.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getMapPage() {
        return `
            <div class="map-page">
                <div class="container">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3><i class="bi bi-map"></i> Workers Map View</h3>
                        <button class="btn btn-outline-primary" onclick="app.loadPage('find-workers')">
                            <i class="bi bi-list"></i> List View
                        </button>
                    </div>
                    
                    <div class="card">
                        <div class="card-body p-0">
                            <div id="map" style="height: 500px; border-radius: 10px;"></div>
                        </div>
                    </div>
                    
                    <div class="row mt-4">
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Workers in this Area</h5>
                                </div>
                                <div class="card-body">
                                    <div id="mapWorkersList">
                                        <!-- Workers list will be loaded here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Map Legend</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <i class="bi bi-geo-alt-fill text-primary me-2"></i>
                                        <span>Worker Location</span>
                                    </div>
                                    <div class="mb-2">
                                        <i class="bi bi-star-fill text-warning me-2"></i>
                                        <span>High Rated (4+ stars)</span>
                                    </div>
                                    <div class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        <span>Verified Worker</span>
                                    </div>
                                    <div class="mb-2">
                                        <i class="bi bi-clock-fill text-info me-2"></i>
                                        <span>Available Now</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getWorkerDashboard() {
        return `
            <div class="worker-dashboard">
                <div class="container">
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="card bg-primary text-white">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h3 class="mb-1">Worker Dashboard</h3>
                                            <p class="mb-0">Welcome back, ${this.currentUser?.fullName || 'Worker'}!</p>
                                        </div>
                                        <div class="avatar-large">
                                            <div class="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center" 
                                                 style="width: 70px; height: 70px; font-size: 1.8rem;">
                                                ${this.currentUser?.fullName?.charAt(0) || 'W'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <!-- Stats -->
                        <div class="col-md-3 mb-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h2 class="text-primary">${this.currentUser?.jobsCompleted || 0}</h2>
                                    <p class="text-muted">Jobs Completed</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h2 class="text-success">₹${this.currentUser?.dailyRate || 0}</h2>
                                    <p class="text-muted">Daily Rate</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h2 class="text-info">${this.currentUser?.rating || 0}/5</h2>
                                    <p class="text-muted">Rating</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h2 class="text-warning">${this.currentUser?.profileViews || 0}</h2>
                                    <p class="text-muted">Profile Views</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Dashboard Content -->
                    <div class="row">
                        <div class="col-md-8">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0">Recent Job Requests</h5>
                                </div>
                                <div class="card-body">
                                    <div id="jobRequests">
                                        <p class="text-muted">No job requests yet. Your profile is now visible to customers.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Your Profile</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p><strong>Name:</strong> ${this.currentUser?.fullName || 'Not set'}</p>
                                            <p><strong>Profession:</strong> ${this.getProfessionName(this.currentUser?.profession) || 'Not set'}</p>
                                            <p><strong>Experience:</strong> ${this.currentUser?.experience || 'Not specified'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Area:</strong> ${this.currentUser?.area || 'Not set'}</p>
                                            <p><strong>Mobile:</strong> ${this.currentUser?.mobile || 'Not set'}</p>
                                            <p><strong>Status:</strong> <span class="badge bg-success">Active</span></p>
                                        </div>
                                    </div>
                                    <div class="mt-3">
                                        <button class="btn btn-primary" onclick="app.loadPage('profile')">
                                            <i class="bi bi-pencil"></i> Edit Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0">Quick Actions</h5>
                                </div>
                                <div class="card-body">
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-outline-primary" onclick="app.updateAvailability()">
                                            <i class="bi bi-calendar-check"></i> Update Availability
                                        </button>
                                        <button class="btn btn-outline-success" onclick="app.viewProfile()">
                                            <i class="bi bi-eye"></i> View Public Profile
                                        </button>
                                        <button class="btn btn-outline-info" onclick="app.loadPage('find-workers')">
                                            <i class="bi bi-search"></i> Browse Jobs
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Tips for Success</h5>
                                </div>
                                <div class="card-body">
                                    <ul class="list-unstyled mb-0">
                                        <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> Keep your profile updated</li>
                                        <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> Respond quickly to job requests</li>
                                        <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> Ask customers for reviews</li>
                                        <li><i class="bi bi-check-circle text-success me-2"></i> Maintain good ratings</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProfessionalDashboard() {
        return `
            <div class="professional-dashboard">
                <div class="container">
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="card bg-success text-white">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h3 class="mb-1">Professional Dashboard</h3>
                                            <p class="mb-0">Manage your team of workers</p>
                                        </div>
                                        <div class="avatar-large">
                                            <div class="rounded-circle bg-white text-success d-flex align-items-center justify-content-center" 
                                                 style="width: 70px; height: 70px; font-size: 1.8rem;">
                                                <i class="bi bi-people"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <!-- Stats -->
                        <div class="col-md-3 mb-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h2 class="text-primary" id="totalWorkersStat">0</h2>
                                    <p class="text-muted">Total Workers</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h2 class="text-success" id="activeWorkersStat">0</h2>
                                    <p class="text-muted">Active Workers</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h2 class="text-info" id="jobsThisMonthStat">0</h2>
                                    <p class="text-muted">Jobs This Month</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h2 class="text-warning" id="totalEarningsStat">₹0</h2>
                                    <p class="text-muted">Total Earnings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <!-- Left Column: Add Worker Form -->
                        <div class="col-lg-4 mb-4">
                            <div class="card">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="bi bi-person-plus"></i> Add New Worker</h5>
                                </div>
                                <div class="card-body">
                                    <form id="addWorkerForm">
                                        <div class="mb-3">
                                            <label class="form-label">Worker Name *</label>
                                            <input type="text" class="form-control" id="workerName" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Mobile Number *</label>
                                            <input type="tel" class="form-control" id="workerMobile" 
                                                   pattern="[6-9][0-9]{9}" required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Profession *</label>
                                            <select class="form-select" id="workerProfession" required>
                                                <option value="">Select Profession</option>
                                                <option value="mason">Mason</option>
                                                <option value="electrician">Electrician</option>
                                                <option value="plumber">Plumber</option>
                                                <option value="painter">Painter</option>
                                                <option value="carpenter">Carpenter</option>
                                                <option value="welder">Welder</option>
                                                <option value="driver">Driver</option>
                                                <option value="cleaner">Cleaner</option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Daily Rate (₹)</label>
                                            <input type="number" class="form-control" id="dailyRate" 
                                                   min="500" max="5000" value="800">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Skills</label>
                                            <textarea class="form-control" id="workerSkills" 
                                                      rows="2" placeholder="e.g., Tile work, Brick laying"></textarea>
                                        </div>
                                        
                                        <div class="d-grid">
                                            <button type="submit" class="btn btn-success">
                                                <i class="bi bi-person-plus"></i> Add Worker
                                            </button>
                                        </div>
                                        
                                        <div class="alert alert-info mt-3">
                                            <small>
                                                <i class="bi bi-info-circle"></i>
                                                First 10 workers free. ₹10 per worker after that.
                                            </small>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            
                            <!-- Payment Info -->
                            <div class="card mt-3">
                                <div class="card-header bg-info text-white">
                                    <h6 class="mb-0"><i class="bi bi-credit-card"></i> Payment Info</h6>
                                </div>
                                <div class="card-body">
                                    <p class="small mb-2">Current Plan: <strong>FREE</strong></p>
                                    <p class="small mb-2">Workers Added: <strong id="freeWorkersCount">0/10</strong></p>
                                    <p class="small mb-0">Next Payment: After 10 workers (₹100)</p>
                                    <div class="progress mt-2" style="height: 8px;">
                                        <div class="progress-bar bg-warning" id="paymentProgress" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Column: Workers List -->
                        <div class="col-lg-8">
                            <div class="card">
                                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0"><i class="bi bi-people"></i> Your Workers</h5>
                                    <div class="btn-group">
                                        <button class="btn btn-light btn-sm" onclick="app.filterWorkers('all')">All</button>
                                        <button class="btn btn-light btn-sm" onclick="app.filterWorkers('active')">Active</button>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Profession</th>
                                                    <th>Mobile</th>
                                                    <th>Rate</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody id="workersTableBody">
                                                <tr>
                                                    <td colspan="6" class="text-center py-4">
                                                        <div class="spinner-border spinner-border-sm"></div>
                                                        <p class="mt-2">Loading workers...</p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProfilePage() {
        return `
            <div class="profile-page">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-8 mx-auto">
                            <div class="card border-0 shadow">
                                <div class="card-header bg-primary text-white">
                                    <h3 class="mb-0"><i class="bi bi-person"></i> My Profile</h3>
                                </div>
                                <div class="card-body p-4">
                                    <form id="profileForm">
                                        <div class="text-center mb-4">
                                            <div class="profile-avatar mx-auto mb-3">
                                                <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto" 
                                                     style="width: 100px; height: 100px; font-size: 2.5rem;">
                                                    ${this.currentUser?.fullName?.charAt(0) || 'U'}
                                                </div>
                                            </div>
                                            <h4>${this.currentUser?.fullName || 'User'}</h4>
                                            <p class="text-muted">${this.getUserTypeDisplay(this.currentUser?.userType)}</p>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Full Name</label>
                                                <input type="text" class="form-control" id="profileName" 
                                                       value="${this.currentUser?.fullName || ''}">
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Mobile Number</label>
                                                <input type="text" class="form-control" id="profileMobile" 
                                                       value="${this.currentUser?.mobile || ''}" readonly>
                                            </div>
                                        </div>
                                        
                                        ${this.currentUser?.userType !== 'customer' ? `
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Profession</label>
                                                    <select class="form-select" id="profileProfession">
                                                        <option value="">Select Profession</option>
                                                        <option value="mason" ${this.currentUser?.profession === 'mason' ? 'selected' : ''}>Mason</option>
                                                        <option value="electrician" ${this.currentUser?.profession === 'electrician' ? 'selected' : ''}>Electrician</option>
                                                        <option value="plumber" ${this.currentUser?.profession === 'plumber' ? 'selected' : ''}>Plumber</option>
                                                        <option value="painter" ${this.currentUser?.profession === 'painter' ? 'selected' : ''}>Painter</option>
                                                        <option value="carpenter" ${this.currentUser?.profession === 'carpenter' ? 'selected' : ''}>Carpenter</option>
                                                        <option value="welder" ${this.currentUser?.profession === 'welder' ? 'selected' : ''}>Welder</option>
                                                        <option value="driver" ${this.currentUser?.profession === 'driver' ? 'selected' : ''}>Driver</option>
                                                        <option value="cleaner" ${this.currentUser?.profession === 'cleaner' ? 'selected' : ''}>Cleaner</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Experience</label>
                                                    <select class="form-select" id="profileExperience">
                                                        <option value="">Select Experience</option>
                                                        <option value="0-1" ${this.currentUser?.experience === '0-1' ? 'selected' : ''}>0-1 Years</option>
                                                        <option value="1-3" ${this.currentUser?.experience === '1-3' ? 'selected' : ''}>1-3 Years</option>
                                                        <option value="3-5" ${this.currentUser?.experience === '3-5' ? 'selected' : ''}>3-5 Years</option>
                                                        <option value="5-10" ${this.currentUser?.experience === '5-10' ? 'selected' : ''}>5-10 Years</option>
                                                        <option value="10+" ${this.currentUser?.experience === '10+' ? 'selected' : ''}>10+ Years</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Daily Rate (₹)</label>
                                                    <input type="number" class="form-control" id="profileDailyRate" 
                                                           value="${this.currentUser?.dailyRate || 800}">
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label">Age</label>
                                                    <input type="number" class="form-control" id="profileAge" 
                                                           value="${this.currentUser?.age || ''}">
                                                </div>
                                            </div>
                                            
                                            <div class="mb-3">
                                                <label class="form-label">Skills</label>
                                                <textarea class="form-control" id="profileSkills" rows="3">${this.currentUser?.skills || ''}</textarea>
                                            </div>
                                        ` : ''}
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Complete Address</label>
                                            <textarea class="form-control" id="profileAddress" rows="3">${this.currentUser?.address || ''}</textarea>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Area / Location</label>
                                                <input type="text" class="form-control" id="profileArea" 
                                                       value="${this.currentUser?.area || ''}">
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label">Pincode</label>
                                                <input type="text" class="form-control" id="profilePincode" 
                                                       value="${this.currentUser?.pincode || ''}">
                                            </div>
                                        </div>
                                        
                                        <div class="d-grid gap-2">
                                            <button type="submit" class="btn btn-primary">
                                                <i class="bi bi-save"></i> Save Changes
                                            </button>
                                            <button type="button" class="btn btn-outline-secondary" onclick="app.goBack()">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getPaymentPage() {
        return `
            <div class="payment-page">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <div class="card border-0 shadow">
                                <div class="card-header bg-primary text-white">
                                    <h3 class="mb-0"><i class="bi bi-credit-card"></i> Payment & Pricing</h3>
                                </div>
                                <div class="card-body p-4">
                                    <!-- Current Plan -->
                                    <div class="card mb-4">
                                        <div class="card-body">
                                            <h5 class="card-title">Current Plan</h5>
                                            <div class="row align-items-center">
                                                <div class="col-md-8">
                                                    <h3 class="text-success mb-2">FREE Plan</h3>
                                                    <p class="mb-2">✓ First 10 workers free</p>
                                                    <p class="mb-2">✓ ₹10 per additional worker</p>
                                                    <p class="mb-0">✓ No monthly subscription</p>
                                                </div>
                                                <div class="col-md-4 text-end">
                                                    <div class="display-4 text-primary">₹0</div>
                                                    <small class="text-muted">per month</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Worker Count -->
                                    <div class="card mb-4">
                                        <div class="card-body">
                                            <h5 class="card-title">Your Workers</h5>
                                            <div class="mb-3">
                                                <div class="d-flex justify-content-between mb-1">
                                                    <span>Workers Added</span>
                                                    <span id="currentWorkerCount">0</span>
                                                </div>
                                                <div class="progress" style="height: 10px;">
                                                    <div class="progress-bar bg-warning" id="workerProgress" style="width: 0%"></div>
                                                </div>
                                                <small class="text-muted" id="workerProgressText">0/10 workers (free)</small>
                                            </div>
                                            
                                            <div class="alert alert-info">
                                                <i class="bi bi-info-circle"></i>
                                                You can add <strong id="remainingFree">10</strong> more workers for free.
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Add Credits -->
                                    <div class="card mb-4">
                                        <div class="card-body">
                                            <h5 class="card-title">Add Worker Credits</h5>
                                            <p class="text-muted mb-3">Add credits to add more workers to your account.</p>
                                            
                                            <div class="row g-3 mb-4">
                                                <div class="col-md-4">
                                                    <div class="card payment-option" onclick="app.selectPaymentOption(100)">
                                                        <div class="card-body text-center">
                                                            <h5>10 Workers</h5>
                                                            <h3 class="text-primary">₹100</h3>
                                                            <small class="text-muted">₹10 per worker</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="card payment-option" onclick="app.selectPaymentOption(250)">
                                                        <div class="card-body text-center">
                                                            <h5>25 Workers</h5>
                                                            <h3 class="text-primary">₹250</h3>
                                                            <small class="text-muted">₹10 per worker</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="card payment-option" onclick="app.selectPaymentOption(500)">
                                                        <div class="card-body text-center">
                                                            <h5>50 Workers</h5>
                                                            <h3 class="text-primary">₹500</h3>
                                                            <small class="text-muted">₹10 per worker</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <!-- Payment Form -->
                                            <form id="paymentForm" style="display: none;">
                                                <div class="mb-3">
                                                    <label class="form-label">Amount</label>
                                                    <input type="text" class="form-control" id="paymentAmount" readonly>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Number of Workers</label>
                                                    <input type="text" class="form-control" id="workerCount" readonly>
                                                </div>
                                                <div class="d-grid">
                                                    <button type="button" class="btn btn-success btn-lg" onclick="app.processPayment()">
                                                        <i class="bi bi-lock"></i> Pay Securely
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                    
                                    <!-- Payment History -->
                                    <div class="card">
                                        <div class="card-body">
                                            <h5 class="card-title">Payment History</h5>
                                            <div id="paymentHistory">
                                                <p class="text-muted">No payments made yet.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ========== METHODS ==========

    selectRole(role) {
        // Update radio button
        document.getElementById(`${role}Role`).checked = true;
        
        // Show/hide worker fields
        const workerFields = document.getElementById('workerFields');
        if (role === 'customer') {
            workerFields.style.display = 'none';
        } else {
            workerFields.style.display = 'block';
        }
        
        // Update card selection
        document.querySelectorAll('.role-card').forEach(card => {
            card.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    }

    setupRegistrationForm() {
        // Set default role
        this.selectRole('worker');
        
        const form = document.getElementById('registrationForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
    }

    async handleRegistration() {
        const form = document.getElementById('registrationForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating Account...';
        submitBtn.disabled = true;
        
        try {
            // Get form data
            const userType = document.querySelector('input[name="userType"]:checked').value;
            const mobile = document.getElementById('mobile').value.trim();
            
            // Check if user exists
            if (this.firebaseService) {
                const existingUser = await this.firebaseService.getUserByMobile(mobile);
                if (existingUser.success) {
                    throw new Error('User with this mobile number already exists. Please login.');
                }
            }
            
            // Prepare user data
            const userData = {
                fullName: document.getElementById('fullName').value.trim(),
                mobile: mobile,
                userType: userType,
                createdAt: new Date().toISOString(),
                isActive: true,
                isVerified: false,
                rating: 0,
                jobsCompleted: 0,
                profileViews: 0
            };
            
            // Add worker-specific fields
            if (userType !== 'customer') {
                userData.profession = document.getElementById('profession').value;
                userData.experience = document.getElementById('experience').value;
                userData.dailyRate = parseInt(document.getElementById('dailyRate').value) || 800;
                userData.age = parseInt(document.getElementById('age').value) || 0;
                userData.skills = document.getElementById('skills').value.trim();
                userData.address = document.getElementById('address').value.trim();
                userData.area = document.getElementById('area').value.trim();
                userData.pincode = document.getElementById('pincode').value.trim();
                userData.fatherName = ''; // Can add field later
                
                // Validate required fields
                if (!userData.profession) throw new Error('Please select your profession');
                if (!userData.address) throw new Error('Please enter your address');
                if (!userData.area) throw new Error('Please enter your area/location');
            }
            
            // Save to Firebase
            if (this.firebaseService) {
                const result = await this.firebaseService.addUser(userData);
                
                if (result.success) {
                    // Update area and profession collections
                    if (userType !== 'customer') {
                        await this.firebaseService.updateAreaCollection(userData.area);
                        await this.firebaseService.updateProfessionCollection(userData.profession);
                    }
                    
                    // Set current user
                    this.currentUser = {
                        id: result.userId,
                        ...userData
                    };
                    
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    
                    this.showNotification('🎉 Account created successfully!', 'success');
                    
                    // Redirect based on user type
                    setTimeout(() => {
                        if (userType === 'worker') {
                            this.loadPage('worker-dashboard');
                        } else if (userType === 'professional') {
                            this.loadPage('professional-dashboard');
                        } else {
                            this.loadPage('find-workers');
                        }
                    }, 1500);
                    
                } else {
                    throw new Error(result.message || 'Registration failed');
                }
            } else {
                // Fallback to localStorage
                const userId = 'user_' + Date.now();
                this.currentUser = {
                    id: userId,
                    ...userData
                };
                
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.showNotification('🎉 Account created (demo mode)', 'success');
                setTimeout(() => this.loadPage('home'), 1000);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(error.message || 'Registration failed', 'error');
            
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;
        
        // Send OTP button
        const sendOTPBtn = document.getElementById('sendOTPBtn');
        if (sendOTPBtn) {
            sendOTPBtn.onclick = (e) => {
                e.preventDefault();
                this.sendOTP();
            };
        }
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    async sendOTP() {
        const mobileInput = document.getElementById('loginMobile');
        const mobile = mobileInput.value.trim();
        const sendOTPBtn = document.getElementById('sendOTPBtn');
        
        // Validate mobile
        if (!this.validateIndianMobile(mobile)) {
            this.showNotification('Please enter a valid 10-digit Indian mobile number', 'error');
            mobileInput.focus();
            return;
        }
        
        try {
            // Show loading
            const originalText = sendOTPBtn.innerHTML;
            sendOTPBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            sendOTPBtn.disabled = true;
            
            if (this.firebaseService) {
                // Send OTP via Firebase
                const result = await this.firebaseService.sendOTP(mobile);
                
                if (result.success) {
                    this.showNotification('OTP sent to ' + mobile, 'success');
                    
                    // Show OTP section
                    document.getElementById('otpSection').style.display = 'block';
                    document.getElementById('otp').focus();
                    
                    // Start timer
                    this.startOTPTimer();
                    
                } else {
                    this.showNotification('Failed: ' + result.message, 'error');
                }
            } else {
                // Demo mode
                this.showNotification('Demo: OTP would be sent to ' + mobile, 'info');
                document.getElementById('otpSection').style.display = 'block';
                document.getElementById('otp').value = '123456';
                this.startOTPTimer();
            }
            
        } catch (error) {
            console.error('OTP error:', error);
            this.showNotification('Error sending OTP', 'error');
            
        } finally {
            setTimeout(() => {
                sendOTPBtn.innerHTML = 'Send OTP';
                sendOTPBtn.disabled = false;
            }, 2000);
        }
    }

    startOTPTimer() {
        let timeLeft = 60;
        const timerElement = document.getElementById('otpTimer');
        
        const timer = setInterval(() => {
            timerElement.textContent = `OTP valid for ${timeLeft} seconds`;
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(timer);
                timerElement.textContent = 'OTP expired';
                timerElement.className = 'text-danger';
            }
        }, 1000);
    }

    async handleLogin() {
        const mobile = document.getElementById('loginMobile').value.trim();
        const otp = document.getElementById('otp')?.value.trim() || '123456';
        const loginBtn = document.getElementById('loginBtn');
        
        if (!this.validateIndianMobile(mobile)) {
            this.showNotification('Invalid mobile number', 'error');
            return;
        }
        
        // Show loading
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        loginBtn.disabled = true;
        
        try {
            let userData = null;
            
            if (this.firebaseService) {
                // Verify OTP
                const otpResult = await this.firebaseService.verifyOTP(otp);
                
                if (!otpResult.success) {
                    throw new Error('Invalid OTP');
                }
                
                // Get user from Firestore
                const userResult = await this.firebaseService.getUserByMobile(mobile);
                
                if (userResult.success) {
                    userData = userResult.user;
                } else {
                    // New user - redirect to registration
                    this.showNotification('User not found. Please register first.', 'info');
                    setTimeout(() => this.loadPage('registration'), 1000);
                    return;
                }
                
            } else {
                // Demo mode
                const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
                userData = demoUsers.find(u => u.mobile === mobile);
                
                if (!userData) {
                    throw new Error('User not found. Please register first.');
                }
            }
            
            // Set current user
            this.currentUser = userData;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showNotification(`Welcome back, ${userData.fullName}!`, 'success');
            
            // Redirect based on user type
            setTimeout(() => {
                if (userData.userType === 'customer') {
                    this.loadPage('find-workers');
                } else if (userData.userType === 'worker') {
                    this.loadPage('worker-dashboard');
                } else if (userData.userType === 'professional') {
                    this.loadPage('professional-dashboard');
                } else {
                    this.loadPage('home');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Login failed', 'error');
            
        } finally {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    async loadWorkers() {
        const workersGrid = document.getElementById('workersGrid');
        const resultsCount = document.getElementById('resultsCount');
        
        if (!workersGrid) return;
        
        // Show loading
        workersGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Loading workers...</p>
            </div>
        `;
        
        try {
            let workers = [];
            
            if (this.firebaseService) {
                // Load from Firebase
                const result = await this.firebaseService.getAllWorkers({ isActive: true });
                workers = result.workers;
            } else {
                // Demo data
                workers = this.getDemoWorkers();
            }
            
            // Display workers
            if (workers.length > 0) {
                this.displayWorkers(workers);
                resultsCount.textContent = `Found ${workers.length} workers`;
            } else {
                workersGrid.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-info">
                            <h5>No workers found yet</h5>
                            <p>Be the first to register in your area!</p>
                            <button class="btn btn-primary" onclick="app.loadPage('registration')">
                                Register as Worker
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // Setup search form
            this.setupSearchForm();
            
        } catch (error) {
            console.error('Error loading workers:', error);
            workersGrid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Error loading workers: ${error.message}
                    </div>
                </div>
            `;
        }
    }

    displayWorkers(workers) {
        const container = document.getElementById('workersGrid');
        if (!container) return;
        
        container.innerHTML = workers.map(worker => `
            <div class="col-xl-4 col-lg-6 col-md-6">
                <div class="card worker-card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="worker-avatar">
                                ${worker.fullName?.charAt(0) || 'W'}
                            </div>
                            <div class="worker-info">
                                <h5 class="mb-1">${worker.fullName || 'Worker'}</h5>
                                <div class="d-flex align-items-center mb-2">
                                    <span class="badge bg-primary me-2">${this.getProfessionName(worker.profession)}</span>
                                    ${worker.isVerified ? '<span class="badge bg-success">Verified</span>' : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="worker-details mb-3">
                            <p class="mb-1">
                                <i class="bi bi-geo-alt text-muted"></i> 
                                ${worker.area || 'Location not specified'}
                            </p>
                            <p class="mb-1">
                                <i class="bi bi-clock-history text-muted"></i> 
                                ${worker.experience || 'Experience not specified'}
                            </p>
                            <p class="mb-1">
                                <i class="bi bi-cash text-muted"></i> 
                                ₹${worker.dailyRate || 'Rate not specified'}/day
                            </p>
                            ${worker.rating ? `
                                <p class="mb-1">
                                    <i class="bi bi-star-fill text-warning"></i> 
                                    ${worker.rating.toFixed(1)}/5
                                </p>
                            ` : ''}
                        </div>
                        
                        ${worker.skills ? `
                            <div class="worker-skills mb-3">
                                <h6 class="small mb-2">Skills:</h6>
                                <div class="d-flex flex-wrap gap-1">
                                    ${worker.skills.split(',').slice(0, 3).map(skill => `
                                        <span class="badge">${skill.trim()}</span>
                                    `).join('')}
                                    ${worker.skills.split(',').length > 3 ? '<span class="badge">+more</span>' : ''}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-outline-primary btn-sm" onclick="app.viewWorker('${worker.id}')">
                                View
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="app.contactWorker('${worker.id}')">
                                Contact
                            </button>
                            <button class="btn btn-success btn-sm" onclick="app.hireWorker('${worker.id}')">
                                Hire
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupSearchForm() {
        const form = document.getElementById('searchForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.searchWorkers();
        });
    }

    async searchWorkers() {
        const area = document.getElementById('searchArea')?.value.trim();
        const profession = document.getElementById('searchProfession')?.value;
        const experience = document.getElementById('searchExperience')?.value;
        const minRate = document.getElementById('minRate')?.value;
        const maxRate = document.getElementById('maxRate')?.value;
        
        try {
            let filters = { isActive: true };
            if (area) filters.area = area;
            if (profession) filters.profession = profession;
            
            let workers = [];
            
            if (this.firebaseService) {
                const result = await this.firebaseService.getAllWorkers(filters);
                workers = result.workers;
            } else {
                workers = this.getDemoWorkers();
            }
            
            // Apply additional filters
            if (experience) {
                workers = workers.filter(w => w.experience === experience);
            }
            
            if (minRate) {
                workers = workers.filter(w => w.dailyRate >= parseInt(minRate));
            }
            
            if (maxRate) {
                workers = workers.filter(w => w.dailyRate <= parseInt(maxRate));
            }
            
            // Display results
            this.displayWorkers(workers);
            document.getElementById('resultsCount').textContent = `Found ${workers.length} workers`;
            
        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('Search failed', 'error');
        }
    }

    async loadMap() {
        // This would load Leaflet map with worker locations
        // Implementation depends on having location data
        setTimeout(() => {
            const mapDiv = document.getElementById('map');
            if (mapDiv) {
                mapDiv.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-map" style="font-size: 3rem; color: #6c757d;"></i>
                        <h4 class="mt-3">Map View</h4>
                        <p class="text-muted">Worker locations will be shown here</p>
                        <p class="small text-muted">(Requires worker location data)</p>
                    </div>
                `;
            }
        }, 100);
    }

    async loadProfessionalDashboard() {
        if (!this.currentUser || this.currentUser.userType !== 'professional') {
            this.loadPage('home');
            return;
        }
        
        // Load professional's workers
        if (this.firebaseService) {
            try {
                const result = await this.firebaseService.getWorkersByProfessional(this.currentUser.id);
                
                if (result.success) {
                    const workers = result.workers;
                    
                    // Update stats
                    document.getElementById('totalWorkersStat').textContent = workers.length;
                    document.getElementById('activeWorkersStat').textContent = workers.filter(w => w.isActive).length;
                    
                    // Update table
                    const tableBody = document.getElementById('workersTableBody');
                    if (tableBody && workers.length > 0) {
                        tableBody.innerHTML = workers.map(worker => `
                            <tr>
                                <td>${worker.fullName}</td>
                                <td>${this.getProfessionName(worker.profession)}</td>
                                <td>${worker.mobile}</td>
                                <td>₹${worker.dailyRate || 0}</td>
                                <td>
                                    <span class="badge ${worker.isActive ? 'bg-success' : 'bg-secondary'}">
                                        ${worker.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="app.editWorker('${worker.id}')">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteWorker('${worker.id}')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('');
                    }
                }
            } catch (error) {
                console.error('Error loading professional dashboard:', error);
            }
        }
    }

    async addWorkerByProfessional(workerData) {
        if (!this.currentUser || this.currentUser.userType !== 'professional') {
            this.showNotification('Professional account required', 'error');
            return;
        }
        
        try {
            const result = await this.firebaseService.addWorker(workerData, this.currentUser.id);
            
            if (result.success) {
                this.showNotification('Worker added successfully', 'success');
                this.loadProfessionalDashboard();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.showNotification('Error adding worker: ' + error.message, 'error');
        }
    }

    // Utility methods
    validateIndianMobile(mobile) {
        return /^[6-9]\d{9}$/.test(mobile);
    }

    getProfessionName(code) {
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
        return professions[code] || code;
    }

    getUserTypeDisplay(userType) {
        const types = {
            'worker': 'Individual Worker',
            'professional': 'Professional Contractor',
            'customer': 'Customer'
        };
        return types[userType] || userType;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    setupEventListeners() {
        // Handle back button
        window.addEventListener('popstate', () => {
            this.loadPage(this.currentPage);
        });
    }

    logout() {
        // Firebase logout
        if (this.firebaseService) {
            this.firebaseService.signOut();
        }
        
        // Clear local data
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        this.showNotification('Logged out successfully', 'info');
        
        setTimeout(() => {
            this.loadPage('home');
        }, 1000);
    }

    demoLogin(userType) {
        // Demo login for testing
        const demoData = {
            worker: {
                id: 'demo_worker_001',
                fullName: 'Rajesh Kumar',
                mobile: '9876543210',
                userType: 'worker',
                profession: 'electrician',
                experience: '5-10 Years',
                dailyRate: 1000,
                rating: 4.5,
                jobsCompleted: 25,
                area: 'Mumbai',
                address: '123, Andheri East',
                skills: 'Wiring, Repair, Installation'
            },
            customer: {
                id: 'demo_customer_001',
                fullName: 'Amit Sharma',
                mobile: '9876543211',
                userType: 'customer',
                area: 'Delhi'
            },
            professional: {
                id: 'demo_prof_001',
                fullName: 'Construction Company',
                mobile: '9876543212',
                userType: 'professional',
                area: 'Bangalore',
                workersCount: 5
            }
        };
        
        this.currentUser = demoData[userType];
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.showNotification(`Demo login as ${userType}`, 'success');
        
        setTimeout(() => {
            if (userType === 'worker') {
                this.loadPage('worker-dashboard');
            } else if (userType === 'professional') {
                this.loadPage('professional-dashboard');
            } else {
                this.loadPage('find-workers');
            }
        }, 500);
    }

    getDemoWorkers() {
        return [
            {
                id: 'w1',
                fullName: 'Rajesh Kumar',
                profession: 'electrician',
                area: 'Mumbai',
                experience: '5-10 Years',
                dailyRate: 1000,
                mobile: '9876543210',
                rating: 4.5,
                isVerified: true,
                skills: 'Wiring, Repair, Installation',
                jobsCompleted: 25
            },
            {
                id: 'w2',
                fullName: 'Suresh Patel',
                profession: 'plumber',
                area: 'Delhi',
                experience: '3-5 Years',
                dailyRate: 800,
                mobile: '9876543211',
                rating: 4.2,
                isVerified: false,
                skills: 'Pipe fitting, Repair',
                jobsCompleted: 15
            },
            {
                id: 'w3',
                fullName: 'Mohan Singh',
                profession: 'mason',
                area: 'Bangalore',
                experience: '10+ Years',
                dailyRate: 1200,
                mobile: '9876543212',
                rating: 4.7,
                isVerified: true,
                skills: 'Construction, Tile work',
                jobsCompleted: 40
            }
        ];
    }
}

// Make app available globally
window.LabourHiringApp = LabourHiringApp;