// Login Page Feature - Authentication and Email Validation
class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    setupEventListeners() {
        // Login form submission
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Password toggle visibility
        document.getElementById('togglePassword').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Real-time email validation
        document.getElementById('email').addEventListener('input', () => {
            this.validateEmail();
        });

        // Real-time password validation
        document.getElementById('password').addEventListener('input', () => {
            this.validatePassword();
        });
    }

    // Check if user is already authenticated
    checkExistingAuth() {
        const isAuthenticated = localStorage.getItem('tideHoopsAuthenticated');
        const userEmail = localStorage.getItem('tideHoopsUserEmail');
        
        if (isAuthenticated === 'true' && userEmail) {
            // Redirect to main page if already logged in
            window.location.href = 'index.html';
        }
    }

    // Handle login form submission
    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validate inputs
        if (!this.validateEmail() || !this.validatePassword()) {
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Simulate authentication (replace with actual API call)
            const isValid = await this.authenticateUser(email, password);
            
            if (isValid) {
                // Store authentication data
                localStorage.setItem('tideHoopsAuthenticated', 'true');
                localStorage.setItem('tideHoopsUserEmail', email);
                localStorage.setItem('tideHoopsLoginTime', new Date().toISOString());

                // Show success message
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to main page after short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.showMessage('Invalid email or password. Please try again.', 'danger');
            }
        } catch (error) {
            this.showMessage('Login failed. Please try again.', 'danger');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Simulate user authentication (replace with actual API)
    async authenticateUser(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, accept any @crimson.ua.edu email with password "password"
        // In production, this would make an API call to your authentication service
        const validEmails = [
            'player1@crimson.ua.edu',
            'player2@crimson.ua.edu',
            'coach@crimson.ua.edu',
            'tastaples@crimson.ua.edu',
            'mthayden@crimson.ua.edu',
            'ewhardage@crimson.ua.edu',
            'gjsegura@crimson.ua.edu'
        ];
        
        return validEmails.includes(email.toLowerCase()) && password === 'password';
    }

    // Validate email format and domain
    validateEmail() {
        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@crimson\.ua\.edu$/i;
        
        if (email === '') {
            emailInput.classList.remove('is-valid', 'is-invalid');
            return false;
        }
        
        if (emailRegex.test(email)) {
            emailInput.classList.remove('is-invalid');
            emailInput.classList.add('is-valid');
            return true;
        } else {
            emailInput.classList.remove('is-valid');
            emailInput.classList.add('is-invalid');
            return false;
        }
    }

    // Validate password
    validatePassword() {
        const passwordInput = document.getElementById('password');
        const password = passwordInput.value;
        
        if (password === '') {
            passwordInput.classList.remove('is-valid', 'is-invalid');
            return false;
        }
        
        if (password.length >= 6) {
            passwordInput.classList.remove('is-invalid');
            passwordInput.classList.add('is-valid');
            return true;
        } else {
            passwordInput.classList.remove('is-valid');
            passwordInput.classList.add('is-invalid');
            return false;
        }
    }

    // Toggle password visibility
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const passwordIcon = document.getElementById('passwordIcon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordIcon.className = 'bi bi-eye-slash';
        } else {
            passwordInput.type = 'password';
            passwordIcon.className = 'bi bi-eye';
        }
    }

    // Set loading state for login button
    setLoadingState(isLoading) {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        const loginBtnText = document.getElementById('loginBtnText');
        const loginSpinner = document.getElementById('loginSpinner');
        
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtnText.textContent = 'Signing In...';
            loginSpinner.classList.remove('d-none');
        } else {
            loginBtn.disabled = false;
            loginBtnText.textContent = 'Sign In';
            loginSpinner.classList.add('d-none');
        }
    }

    // Show message to user
    showMessage(message, type) {
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        messageDiv.classList.remove('d-none');
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.classList.add('d-none');
            }, 3000);
        }
    }
}

// Initialize login manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
