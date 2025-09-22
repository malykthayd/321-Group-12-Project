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
                // Check if user exists in database
                const userExists = await this.checkUserExists(email);
                
                if (!userExists) {
                    // New user - prompt for first and last name
                    const userInfo = await this.promptForUserInfo();
                    if (userInfo) {
                        try {
                            await this.createUserInDatabase(email, userInfo.firstName, userInfo.lastName, userInfo.position);
                        } catch (error) {
                            console.error('Error creating user:', error);
                            this.showMessage('Failed to create user account. Please try again.', 'danger');
                            this.setLoadingState(false);
                            return;
                        }
                    } else {
                        this.showMessage('User information is required to continue.', 'warning');
                        this.setLoadingState(false);
                        return;
                    }
                } else {
                    // Existing user - check if they have a position
                    const user = await this.getUserByEmail(email);
                    if (user && !user.position) {
                        // User exists but no position - prompt for position
                        const positionInfo = await this.promptForPosition();
                        if (positionInfo) {
                            try {
                                await this.updateUserPosition(user.id, positionInfo.position);
                            } catch (error) {
                                console.error('Error updating user position:', error);
                                this.showMessage('Failed to update user information. Please try again.', 'danger');
                                this.setLoadingState(false);
                                return;
                            }
                        } else {
                            this.showMessage('Position is required to continue.', 'warning');
                            this.setLoadingState(false);
                            return;
                        }
                    }
                }

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
            console.error('Login error:', error);
            this.showMessage('Login failed. Please try again.', 'danger');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Simulate user authentication (replace with actual API)
    async authenticateUser(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Accept any @crimson.ua.edu email with password "password"
        // In production, this would make an API call to your authentication service
        const emailRegex = /^[^\s@]+@crimson\.ua\.edu$/i;
        
        return emailRegex.test(email) && password === 'password';
    }

    // Check if user exists in database
    async checkUserExists(email) {
        try {
            const response = await fetch(`http://localhost:5038/api/Player/email/${encodeURIComponent(email)}`);
            return response.ok;
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    }

    // Get user by email
    async getUserByEmail(email) {
        try {
            const response = await fetch(`http://localhost:5038/api/Player/email/${encodeURIComponent(email)}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    // Prompt user for position only
    async promptForPosition() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade show';
            modal.style.display = 'block';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Please select your position</h5>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="positionOnly" class="form-label">Position</label>
                                <select class="form-select" id="positionOnly" required>
                                    <option value="">Select Position</option>
                                    <option value="PG">Point Guard</option>
                                    <option value="SG">Shooting Guard</option>
                                    <option value="SF">Small Forward</option>
                                    <option value="PF">Power Forward</option>
                                    <option value="C">Center</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="savePosition">Save & Continue</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const positionInput = modal.querySelector('#positionOnly');
            positionInput.focus();
            
            modal.querySelector('#savePosition').addEventListener('click', () => {
                const position = modal.querySelector('#positionOnly').value;
                
                if (position) {
                    document.body.removeChild(modal);
                    resolve({ position });
                } else {
                    alert('Please select a position.');
                }
            });
            
            modal.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    modal.querySelector('#savePosition').click();
                }
            });
        });
    }

    // Update user position
    async updateUserPosition(userId, position) {
        try {
            // First get the current user data
            const user = await fetch(`http://localhost:5038/api/Player/${userId}`).then(r => r.json());
            
            const response = await fetch(`http://localhost:5038/api/Player/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userId,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    position: position,
                    photoUrl: user.photoUrl,
                    createdAt: user.createdAt,
                    updatedAt: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update user position');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating user position:', error);
            throw error;
        }
    }

    // Create player for existing user (no longer needed since Player and User are consolidated)
    async createPlayerForUser(userId, position) {
        // This method is no longer needed since Player and User are now the same entity
        // The position update is handled in updateUserPosition
        return Promise.resolve();
    }

    // Prompt user for first and last name
    async promptForUserInfo() {
        return new Promise((resolve) => {
            // Create modal-like prompt
            const modal = document.createElement('div');
            modal.className = 'modal fade show';
            modal.style.display = 'block';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Welcome! Please provide your information</h5>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="firstName" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="firstName" required>
                            </div>
                            <div class="mb-3">
                                <label for="lastName" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="lastName" required>
                            </div>
                            <div class="mb-3">
                                <label for="position" class="form-label">Position</label>
                                <select class="form-select" id="position" required>
                                    <option value="">Select Position</option>
                                    <option value="PG">Point Guard</option>
                                    <option value="SG">Shooting Guard</option>
                                    <option value="SF">Small Forward</option>
                                    <option value="PF">Power Forward</option>
                                    <option value="C">Center</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="saveUserInfo">Save & Continue</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Focus on first name input
            const firstNameInput = modal.querySelector('#firstName');
            firstNameInput.focus();
            
            // Handle save button
            modal.querySelector('#saveUserInfo').addEventListener('click', () => {
                const firstName = modal.querySelector('#firstName').value.trim();
                const lastName = modal.querySelector('#lastName').value.trim();
                const position = modal.querySelector('#position').value;
                
                if (firstName && lastName && position) {
                    document.body.removeChild(modal);
                    resolve({ firstName, lastName, position });
                } else {
                    alert('Please enter first name, last name, and select a position.');
                }
            });
            
            // Handle Enter key
            modal.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    modal.querySelector('#saveUserInfo').click();
                }
            });
        });
    }

    // Create user in database
    async createUserInDatabase(email, firstName, lastName, position) {
        try {
            const response = await fetch('http://localhost:5038/api/Player', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    position: position
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`Failed to create user: ${response.status} ${response.statusText}`);
            }
            
            const user = await response.json();
            console.log('User created successfully:', user);
            return user;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
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
