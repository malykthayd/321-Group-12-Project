// Basketball Workout Tracker Application
class BasketballTracker {
    constructor() {
        this.players = [];
        this.currentPlayer = null;
        this.workouts = this.loadWorkouts();
        this.stats = this.loadStats();
        this.API_BASE = 'http://localhost:5038';
        // Lifting state
        this.lifting = {
            exercises: [],
            workouts: [],
            filters: { playerId: 'all', startDate: null, endDate: null }
        };
        
        this.init().catch(error => {
            console.error('Error initializing BasketballTracker:', error);
        });
    }

    async init() {
        this.setupEventListeners();
        
        // Load players from API
        this.players = await this.loadPlayers();
        // Load lifting data
        await this.initLifting();
        this.currentPlayer = this.players.length > 0 ? this.players[0].id : null;
        
        this.updatePlayerSelect();
        this.updateComparisonSelects();
        this.updateDashboard();
        this.renderStats();
        this.renderPlayers();
        this.updateTeamOverview();
        this.setDefaultDate();
    }

    // Data Management
    async loadPlayers() {
        try {
            const response = await fetch(`${this.API_BASE}/api/Player`);
            if (response.ok) {
                const players = await response.json();
                // Convert API format to frontend format
                return players.map(player => ({
                    id: player.id.toString(), // Convert to string for consistency
                    name: `${player.firstName} ${player.lastName}`,
                    position: player.position,
                    photo: player.photoUrl || null
                }));
            }
        } catch (error) {
            console.error('Error loading players from API:', error);
            // Only fallback to localStorage if API completely fails (network error, etc.)
            const saved = localStorage.getItem('basketballPlayers');
            return saved ? JSON.parse(saved) : [];
        }
        
        // If API returns empty array or other non-error response, return empty array
        return [];
    }

    loadWorkouts() {
        const saved = localStorage.getItem('basketballWorkouts');
        return saved ? JSON.parse(saved) : [];
    }

    loadStats() {
        const saved = localStorage.getItem('basketballStats');
        return saved ? JSON.parse(saved) : [];
    }

    savePlayers() {
        localStorage.setItem('basketballPlayers', JSON.stringify(this.players));
    }

    saveWorkouts() {
        localStorage.setItem('basketballWorkouts', JSON.stringify(this.workouts));
    }

    saveStats() {
        localStorage.setItem('basketballStats', JSON.stringify(this.stats));
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Combined form
        document.getElementById('addEntryBtn').addEventListener('click', () => {
            this.toggleCombinedForm();
        });

        document.getElementById('combinedFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCombinedEntry();
        });

        document.getElementById('cancelCombined').addEventListener('click', () => {
            this.toggleCombinedForm();
        });

        // Player form
        document.getElementById('addPlayerBtn').addEventListener('click', () => {
            this.togglePlayerForm();
        });

        document.getElementById('playerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPlayer();
        });

        document.getElementById('cancelPlayer').addEventListener('click', () => {
            this.togglePlayerForm();
        });

        // Edit player form
        document.getElementById('editPlayerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePlayer();
        });

        document.getElementById('cancelEditPlayer').addEventListener('click', () => {
            this.toggleEditPlayerForm();
        });

        // Photo upload handlers
        document.getElementById('playerPhoto').addEventListener('change', (e) => {
            this.handlePhotoPreview(e, 'photoPreview', 'photoPreviewImg');
        });

        document.getElementById('editPlayerPhoto').addEventListener('change', (e) => {
            this.handlePhotoPreview(e, 'editPhotoPreview', 'editPhotoPreviewImg');
        });

        document.getElementById('removeCurrentPhoto').addEventListener('click', () => {
            this.removeCurrentPhoto();
        });

        // Player selector
        document.getElementById('playerSelect').addEventListener('change', (e) => {
            this.currentPlayer = e.target.value;
            this.updateDashboard();
            this.renderStats();
            this.updateTopShooters();
        });
        // Leaderboard sort change
        const sortSelect = document.getElementById('leaderboardSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.updateTopShooters());
        }

        // Input validation for stats
        document.getElementById('threePointMakes').addEventListener('input', (e) => {
            this.validateStatsInput(e.target, 'threePointAttempts');
        });

        document.getElementById('freeThrowMakes').addEventListener('input', (e) => {
            this.validateStatsInput(e.target, 'freeThrowAttempts');
        });

        // Login Page Feature - Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Player comparison functionality
        document.getElementById('comparePlayer1').addEventListener('change', () => {
            this.updateComparisonButton();
        });

        document.getElementById('comparePlayer2').addEventListener('change', () => {
            this.updateComparisonButton();
        });

        document.getElementById('comparePlayersBtn').addEventListener('click', () => {
            this.comparePlayers();
        });

        document.getElementById('clearComparisonBtn').addEventListener('click', () => {
            this.clearComparison();
        });

        // Event delegation for player buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-player-btn')) {
                const playerId = e.target.getAttribute('data-player-id');
                this.deletePlayer(playerId);
            } else if (e.target.classList.contains('edit-player-btn')) {
                const playerId = e.target.getAttribute('data-player-id');
                this.editPlayer(playerId);
            }
        });
    }

    // Navigation
    switchSection(sectionName) {
        // Check for coach section password protection
        if (sectionName === 'coach') {
            const password = prompt('Enter coach password to access Coach View:');
            if (password !== 'coach') {
                this.showMessage('Incorrect password. Access denied.', 'error');
                return;
            }
        }

        // Update nav buttons
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Update charts when switching to dashboard
        if (sectionName === 'dashboard') {
            setTimeout(() => {
                this.updateCharts();
            }, 100);
        }
    }

    // Form Management
    toggleCombinedForm() {
        const form = document.getElementById('combinedForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
            this.setDefaultDate('sessionDate');
            this.updatePlayerSelectForForm();
            this.setupStatsValidation();
        }
    }

    togglePlayerForm() {
        const form = document.getElementById('playerForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        // Hide edit form when showing add form
        if (form.style.display === 'block') {
            document.getElementById('editPlayerForm').style.display = 'none';
            // Scroll to the add player form
            const addForm = document.getElementById('playerFormElement');
            if (addForm) {
                addForm.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        }
    }

    toggleEditPlayerForm() {
        const form = document.getElementById('editPlayerForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        // Hide add form when showing edit form
        if (form.style.display === 'block') {
            document.getElementById('playerForm').style.display = 'none';
        }
    }

    setDefaultDate(inputId = null) {
        const today = new Date().toISOString().split('T')[0];
        if (inputId) {
            document.getElementById(inputId).value = today;
        } else {
            document.getElementById('sessionDate').value = today;
        }
    }

    // Photo handling methods
    handlePhotoPreview(event, previewContainerId, previewImgId) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById(previewImgId).src = e.target.result;
                document.getElementById(previewContainerId).style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById(previewContainerId).style.display = 'none';
        }
    }

    removeCurrentPhoto() {
        document.getElementById('editPlayerPhoto').value = '';
        document.getElementById('editPhotoPreview').style.display = 'none';
        document.getElementById('currentPhotoDisplay').style.display = 'none';
        document.getElementById('editPlayerFormElement').setAttribute('data-remove-photo', 'true');
    }

    convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Workout Management (Legacy - kept for backward compatibility)
    addWorkout() {
        // This method is kept for backward compatibility but redirects to combined form
        this.toggleCombinedForm();
    }


    deleteWorkout(id) {
        this.workouts = this.workouts.filter(w => w.id !== id);
        this.saveWorkouts();
        this.updateDashboard();
        this.updateTopShooters();
        this.showMessage('Workout deleted successfully!', 'success');
    }

    // Statistics Management (Legacy - kept for backward compatibility)
    addStats() {
        // This method is kept for backward compatibility but redirects to combined form
        this.toggleCombinedForm();
    }

    renderStats() {
        const container = document.getElementById('statsContainer');
        if (!this.currentPlayer) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No player selected.</p>';
            return;
        }
        const isAll = this.currentPlayer === 'all';
        const playerStats = isAll ? this.stats : this.stats.filter(s => s.playerId === this.currentPlayer);
        
        if (playerStats.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No statistics recorded yet.</p>';
            return;
        }

        container.innerHTML = playerStats.map(stat => {
            const player = this.players.find(p => p.id === stat.playerId);
            const playerName = player ? player.name : 'Unknown Player';
            return `
                <div class="stat-item">
                    <h4>${this.formatGameType(stat.gameType)} - ${playerName} - ${this.formatDate(stat.date)}</h4>
                    <div class="row g-2">
                        <div class="col-md-6">
                            <p><strong>3-Point:</strong> ${stat.threePointMakes}/${stat.threePointAttempts} (${this.calculatePercentage(stat.threePointMakes, stat.threePointAttempts)}%)</p>
                            <p><strong>Free Throws:</strong> ${stat.freeThrowMakes}/${stat.freeThrowAttempts} (${this.calculatePercentage(stat.freeThrowMakes, stat.freeThrowAttempts)}%)</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>2-Point:</strong> ${stat.twoPointMakes || 0}/${stat.twoPointAttempts || 0} (${this.calculatePercentage(stat.twoPointMakes || 0, stat.twoPointAttempts || 0)}%)</p>
                            <p><strong>Assists:</strong> ${stat.assists || 0} | <strong>Rebounds:</strong> ${stat.rebounds || 0}</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="tracker.deleteStats(${stat.id})" style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.8rem;">Delete</button>
                </div>
            `;
        }).join('');
    }

    deleteStats(id) {
        this.stats = this.stats.filter(s => s.id !== id);
        this.saveStats();
        this.renderStats();
        this.updateDashboard();
        this.updateTopShooters();
        this.showMessage('Statistics deleted successfully!', 'success');
    }

    // Combined Entry Management
    addCombinedEntry() {
        const form = document.getElementById('combinedFormElement');
        const selectedPlayerId = document.getElementById('selectedPlayer').value;
        
        if (!selectedPlayerId) {
            this.showMessage('Please select a player!', 'error');
            return;
        }

        // Create workout entry
        const workout = {
            id: Date.now(),
            playerId: selectedPlayerId,
            date: document.getElementById('sessionDate').value,
            type: document.getElementById('sessionType').value,
            notes: document.getElementById('notes').value,
            timestamp: new Date().toISOString()
        };

        // Create stats entry
        const stats = {
            id: Date.now() + 1, // Ensure different ID
            playerId: selectedPlayerId,
            date: document.getElementById('sessionDate').value,
            gameType: document.getElementById('sessionType').value,
            threePointAttempts: parseInt(document.getElementById('threePointAttempts').value) || 0,
            threePointMakes: parseInt(document.getElementById('threePointMakes').value) || 0,
            freeThrowAttempts: parseInt(document.getElementById('freeThrowAttempts').value) || 0,
            freeThrowMakes: parseInt(document.getElementById('freeThrowMakes').value) || 0,
            twoPointAttempts: parseInt(document.getElementById('twoPointAttempts').value) || 0,
            twoPointMakes: parseInt(document.getElementById('twoPointMakes').value) || 0,
            assists: parseInt(document.getElementById('assists').value) || 0,
            rebounds: parseInt(document.getElementById('rebounds').value) || 0,
            timestamp: new Date().toISOString()
        };

        // Add both entries
        this.workouts.unshift(workout);
        this.stats.unshift(stats);
        
        // Update current player to the selected player
        this.currentPlayer = selectedPlayerId;
        document.getElementById('playerSelect').value = selectedPlayerId;
        
        // Save data
        this.saveWorkouts();
        this.saveStats();
        
        // Update displays
        this.renderStats();
        this.updateDashboard();
        this.updateTopShooters();
        
        // Close form and reset
        this.toggleCombinedForm();
        form.reset();
        this.setDefaultDate('sessionDate');
        
        this.showMessage('Workout and statistics added successfully!', 'success');
    }

    updatePlayerSelectForForm() {
        const select = document.getElementById('selectedPlayer');
        select.innerHTML = '<option value="">Choose a player...</option>' + 
            this.players.map(player => 
                `<option value="${player.id}">${player.name} (${player.position})</option>`
            ).join('');
    }

    setupStatsValidation() {
        // Real-time percentage calculation
        const updatePercentage = (attemptsId, makesId, displayId) => {
            const attempts = parseInt(document.getElementById(attemptsId).value) || 0;
            const makes = parseInt(document.getElementById(makesId).value) || 0;
            const percentage = attempts > 0 ? Math.round((makes / attempts) * 100) : 0;
            document.getElementById(displayId).textContent = 
                displayId.replace('Percentage', '') + ': ' + percentage + '%';
        };

        // Add event listeners for real-time percentage updates
        document.getElementById('threePointAttempts').addEventListener('input', () => {
            updatePercentage('threePointAttempts', 'threePointMakes', 'threePointPercentage');
        });
        document.getElementById('threePointMakes').addEventListener('input', () => {
            updatePercentage('threePointAttempts', 'threePointMakes', 'threePointPercentage');
        });
        document.getElementById('freeThrowAttempts').addEventListener('input', () => {
            updatePercentage('freeThrowAttempts', 'freeThrowMakes', 'freeThrowPercentage');
        });
        document.getElementById('freeThrowMakes').addEventListener('input', () => {
            updatePercentage('freeThrowAttempts', 'freeThrowMakes', 'freeThrowPercentage');
        });
        document.getElementById('twoPointAttempts').addEventListener('input', () => {
            updatePercentage('twoPointAttempts', 'twoPointMakes', 'twoPointPercentage');
        });
        document.getElementById('twoPointMakes').addEventListener('input', () => {
            updatePercentage('twoPointAttempts', 'twoPointMakes', 'twoPointPercentage');
        });

        // Validation for makes not exceeding attempts
        const validateMakes = (makesId, attemptsId) => {
            const makes = parseInt(document.getElementById(makesId).value) || 0;
            const attempts = parseInt(document.getElementById(attemptsId).value) || 0;
            if (makes > attempts) {
                document.getElementById(makesId).value = attempts;
            }
        };

        document.getElementById('threePointMakes').addEventListener('input', () => {
            validateMakes('threePointMakes', 'threePointAttempts');
        });
        document.getElementById('freeThrowMakes').addEventListener('input', () => {
            validateMakes('freeThrowMakes', 'freeThrowAttempts');
        });
        document.getElementById('twoPointMakes').addEventListener('input', () => {
            validateMakes('twoPointMakes', 'twoPointAttempts');
        });
    }

    // Player Management
    async addPlayer() {
        const form = document.getElementById('playerFormElement');
        
        let photoData = null;
        const photoFile = document.getElementById('playerPhoto').files[0];
        if (photoFile) {
            photoData = await this.convertFileToBase64(photoFile);
        }
        
        // Get current user ID from authentication
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            this.showMessage('User not authenticated. Please log in again.', 'error');
            return;
        }
        
        const playerData = {
            email: currentUser.email,
            firstName: document.getElementById('playerFirstName').value,
            lastName: document.getElementById('playerLastName').value,
            position: document.getElementById('playerPosition').value,
            photoUrl: photoData
        };

        try {
            // Try to add player via API first
            const response = await fetch(`${this.API_BASE}/api/Player`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerData)
            });

            if (response.ok) {
                const newPlayer = await response.json();
                // Convert API response to frontend format
                const player = {
                    id: newPlayer.id.toString(),
                    name: `${newPlayer.firstName} ${newPlayer.lastName}`,
                    position: newPlayer.position,
                    photo: newPlayer.photoUrl || null
                };

                this.players.push(player);
                this.savePlayers();
                
                // Set as current player if it's the first player
                if (this.players.length === 1) {
                    this.currentPlayer = player.id;
                }
                
                this.updatePlayerSelect();
                this.updateComparisonSelects();
                this.renderPlayers();
                this.updateTeamOverview();
                this.updateDashboard();
                this.renderStats();
                this.updateTopShooters();
                this.togglePlayerForm();
                form.reset();
                this.showMessage('Player added successfully!', 'success');
            } else {
                throw new Error('Failed to add player via API');
            }
        } catch (error) {
            console.error('Error adding player via API:', error);
            // Fallback to local storage
            const player = {
                id: Date.now().toString(),
                name: `${document.getElementById('playerFirstName').value} ${document.getElementById('playerLastName').value}`,
                position: document.getElementById('playerPosition').value,
                photo: photoData
            };

            this.players.push(player);
            this.savePlayers();
            
            // Set as current player if it's the first player
            if (this.players.length === 1) {
                this.currentPlayer = player.id;
            }
            
            this.updatePlayerSelect();
            this.updateComparisonSelects();
            this.renderPlayers();
            this.updateTeamOverview();
            this.updateDashboard();
            this.renderStats();
            this.updateTopShooters();
            this.togglePlayerForm();
            form.reset();
            this.showMessage('Player added successfully!', 'success');
        }
    }

    editPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.showMessage('Player not found!', 'error');
            return;
        }

        // Populate the edit form with current player data
        const nameParts = player.name.split(' ');
        document.getElementById('editPlayerFirstName').value = nameParts[0] || '';
        document.getElementById('editPlayerLastName').value = nameParts.slice(1).join(' ') || '';
        document.getElementById('editPlayerPosition').value = player.position;
        
        // Handle photo display
        if (player.photo) {
            document.getElementById('currentPhotoImg').src = player.photo;
            document.getElementById('currentPhotoDisplay').style.display = 'block';
        } else {
            document.getElementById('currentPhotoDisplay').style.display = 'none';
        }
        
        // Reset photo preview and remove photo flag
        document.getElementById('editPhotoPreview').style.display = 'none';
        document.getElementById('editPlayerPhoto').value = '';
        document.getElementById('editPlayerFormElement').removeAttribute('data-remove-photo');
        
        // Store the player ID for the update
        document.getElementById('editPlayerFormElement').setAttribute('data-player-id', playerId);
        
        // Show the edit form first
        this.toggleEditPlayerForm();
        
        // Then scroll to the very top of the page
        window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        });
    }

    async updatePlayer() {
        const form = document.getElementById('editPlayerFormElement');
        const playerId = form.getAttribute('data-player-id');
        
        if (!playerId) {
            this.showMessage('Player ID not found!', 'error');
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            this.showMessage('Player not found!', 'error');
            return;
        }

        // Handle photo update
        const removePhoto = form.getAttribute('data-remove-photo') === 'true';
        const photoFile = document.getElementById('editPlayerPhoto').files[0];
        
        let photoData = player.photo; // Keep existing photo by default
        if (removePhoto) {
            photoData = null;
        } else if (photoFile) {
            photoData = await this.convertFileToBase64(photoFile);
        }

        // Get current user ID from authentication
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
            this.showMessage('User not authenticated. Please log in again.', 'error');
            return;
        }
        
        const playerData = {
            id: parseInt(playerId), // Convert back to int for API
            email: currentUser.email,
            firstName: document.getElementById('editPlayerFirstName').value,
            lastName: document.getElementById('editPlayerLastName').value,
            position: document.getElementById('editPlayerPosition').value,
            photoUrl: photoData
        };

        try {
            // Try to update player via API first
            const response = await fetch(`${this.API_BASE}/api/Player/${playerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerData)
            });

            if (response.ok) {
                // Update local player data
                player.name = `${playerData.firstName} ${playerData.lastName}`;
                player.position = playerData.position;
                player.photo = photoData;

                // Save the updated data
                this.savePlayers();
                
                // Update displays
                this.updatePlayerSelect();
                this.updateComparisonSelects();
                this.renderPlayers();
                this.updateTeamOverview();
                this.updateDashboard();
                this.renderStats();
                this.updateTopShooters();
                
                // Close form and reset
                this.toggleEditPlayerForm();
                form.reset();
                form.removeAttribute('data-player-id');
                
                this.showMessage('Player updated successfully!', 'success');
            } else {
                throw new Error('Failed to update player via API');
            }
        } catch (error) {
            console.error('Error updating player via API:', error);
            // Fallback to local storage update
            player.name = `${document.getElementById('editPlayerFirstName').value} ${document.getElementById('editPlayerLastName').value}`;
            player.position = document.getElementById('editPlayerPosition').value;
            player.photo = photoData;

            // Save the updated data
            this.savePlayers();
            
            // Update displays
            this.updatePlayerSelect();
            this.updateComparisonSelects();
            this.renderPlayers();
            this.updateTeamOverview();
            this.updateDashboard();
            this.renderStats();
            this.updateTopShooters();
            
            // Close form and reset
            this.toggleEditPlayerForm();
            form.reset();
            form.removeAttribute('data-player-id');
            
            this.showMessage('Player updated successfully!', 'success');
        }
    }

    renderPlayers() {
        const container = document.getElementById('playersContainer');
        
        if (this.players.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No players added yet. Add a player to get started!</p>';
            return;
        }
        
        container.innerHTML = this.players.map(player => {
            const playerWorkouts = this.workouts.filter(w => w.playerId === player.id);
            const playerStats = this.stats.filter(s => s.playerId === player.id);
            
            const threePointStats = this.calculatePlayerStats(playerStats, 'threePoint');
            const freeThrowStats = this.calculatePlayerStats(playerStats, 'freeThrow');
            
            return `
                <div class="player-item">
                    <div class="d-flex align-items-start mb-3">
                        <div class="me-3">
                            ${player.photo ? 
                                `<img src="${player.photo}" alt="${player.name}" class="rounded-circle" style="width: 60px; height: 60px; object-fit: cover;">` :
                                `<div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style="width: 60px; height: 60px; font-size: 1.5rem;">${player.name.charAt(0).toUpperCase()}</div>`
                            }
                        </div>
                        <div class="flex-grow-1">
                            <h4>${player.name} (${player.position})</h4>
                            <p><strong>Workouts:</strong> ${playerWorkouts.length}</p>
                            <p><strong>3-Point %:</strong> ${threePointStats.percentage}% (${threePointStats.makes}/${threePointStats.attempts})</p>
                            <p><strong>Free Throw %:</strong> ${freeThrowStats.percentage}% (${freeThrowStats.makes}/${freeThrowStats.attempts})</p>
                        </div>
                    </div>
                    <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-primary edit-player-btn" data-player-id="${player.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Edit</button>
                        <button class="btn btn-secondary delete-player-btn" data-player-id="${player.id}" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async deletePlayer(id) {
        // Check if player exists
        const playerExists = this.players.find(p => p.id === id);
        if (!playerExists) {
            this.showMessage('Player not found!', 'error');
            return;
        }
        
        try {
            // Try to delete player via API first
            const response = await fetch(`${this.API_BASE}/api/Player/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove player and their data from local storage
                this.players = this.players.filter(p => p.id !== id);
                this.workouts = this.workouts.filter(w => w.playerId !== id);
                this.stats = this.stats.filter(s => s.playerId !== id);
                
                // If the deleted player was the current player, update current player
                if (this.currentPlayer === id) {
                    this.currentPlayer = this.players.length > 0 ? this.players[0].id : null;
                }
                
                this.savePlayers();
                this.saveWorkouts();
                this.saveStats();
                
                this.updatePlayerSelect();
                this.updateComparisonSelects();
                this.renderPlayers();
                this.updateTeamOverview();
                this.updateDashboard();
                this.renderStats();
                this.updateTopShooters();
                
                this.showMessage('Player deleted successfully!', 'success');
            } else {
                throw new Error('Failed to delete player via API');
            }
        } catch (error) {
            console.error('Error deleting player via API:', error);
            // Fallback to local storage deletion
            this.players = this.players.filter(p => p.id !== id);
            this.workouts = this.workouts.filter(w => w.playerId !== id);
            this.stats = this.stats.filter(s => s.playerId !== id);
            
            // If the deleted player was the current player, update current player
            if (this.currentPlayer === id) {
                this.currentPlayer = this.players.length > 0 ? this.players[0].id : null;
            }
            
            this.savePlayers();
            this.saveWorkouts();
            this.saveStats();
            
            this.updatePlayerSelect();
            this.updateComparisonSelects();
            this.renderPlayers();
            this.updateTeamOverview();
            this.updateDashboard();
            this.renderStats();
            this.updateTopShooters();
            
            this.showMessage('Player deleted successfully!', 'success');
        }
    }

    updatePlayerSelect() {
        const select = document.getElementById('playerSelect');
        if (this.players.length === 0) {
            select.innerHTML = '<option value="">No players available</option>';
            select.value = '';
        } else {
            // Add an "All Players" option at the top
            const allOption = '<option value="all">All Players</option>';
            const playerOptions = this.players.map(player => `
                <option value="${player.id}">${player.name}</option>`).join('');
            select.innerHTML = allOption + playerOptions;
            // Keep current selection if valid; otherwise default to first player or 'all'
            if (this.currentPlayer && (this.currentPlayer === 'all' || this.players.find(p => p.id === this.currentPlayer))) {
                select.value = this.currentPlayer;
            } else {
                select.value = this.players[0] ? this.players[0].id : 'all';
                this.currentPlayer = select.value;
            }
        }
    }

    // Dashboard Updates
    updateDashboard() {
        if (!this.currentPlayer) {
            // No player selected, show empty dashboard
            document.getElementById('totalWorkouts').textContent = '0';
            document.getElementById('weeklyWorkouts').textContent = '0';
            document.getElementById('threePointPercentage').textContent = '0%';
            document.getElementById('freeThrowPercentage').textContent = '0%';
            document.getElementById('threePointStats').textContent = '0/0 (0%)';
            document.getElementById('freeThrowStats').textContent = '0/0 (0%)';
            document.getElementById('threePointTrend').textContent = 'No data';
            document.getElementById('freeThrowTrend').textContent = 'No data';
            return;
        }
        
        const isAll = this.currentPlayer === 'all';
        const playerWorkouts = isAll ? this.workouts : this.workouts.filter(w => w.playerId === this.currentPlayer);
        const playerStats = isAll ? this.stats : this.stats.filter(s => s.playerId === this.currentPlayer);
        
        // Total workouts
        document.getElementById('totalWorkouts').textContent = playerWorkouts.length;
        
        // Weekly workouts
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyWorkouts = playerWorkouts.filter(w => new Date(w.date) >= oneWeekAgo).length;
        document.getElementById('weeklyWorkouts').textContent = weeklyWorkouts;
        
        // Statistics
        const threePointStats = this.calculatePlayerStats(playerStats, 'threePoint');
        const freeThrowStats = this.calculatePlayerStats(playerStats, 'freeThrow');
        
        document.getElementById('threePointPercentage').textContent = `${threePointStats.percentage}%`;
        document.getElementById('freeThrowPercentage').textContent = `${freeThrowStats.percentage}%`;
        
        // Update stats overview
        document.getElementById('threePointStats').textContent = 
            `${threePointStats.makes}/${threePointStats.attempts} (${threePointStats.percentage}%)`;
        document.getElementById('freeThrowStats').textContent = 
            `${freeThrowStats.makes}/${freeThrowStats.attempts} (${freeThrowStats.percentage}%)`;
        
        // Update trends
        document.getElementById('threePointTrend').textContent = this.calculateTrend(playerStats, 'threePoint');
        document.getElementById('freeThrowTrend').textContent = this.calculateTrend(playerStats, 'freeThrow');
        
        // Update top shooters leaderboard
        this.updateTopShooters();
    }

    updateTeamOverview() {
        const totalPlayers = this.players.length;
        const totalWorkouts = this.workouts.length;
        
        let totalThreePointMakes = 0;
        let totalThreePointAttempts = 0;
        let totalFreeThrowMakes = 0;
        let totalFreeThrowAttempts = 0;
        
        this.stats.forEach(stat => {
            totalThreePointMakes += stat.threePointMakes;
            totalThreePointAttempts += stat.threePointAttempts;
            totalFreeThrowMakes += stat.freeThrowMakes;
            totalFreeThrowAttempts += stat.freeThrowAttempts;
        });
        
        const avgThreePoint = this.calculatePercentage(totalThreePointMakes, totalThreePointAttempts);
        const avgFreeThrow = this.calculatePercentage(totalFreeThrowMakes, totalFreeThrowAttempts);
        
        document.getElementById('totalPlayers').textContent = totalPlayers;
        document.getElementById('teamThreePointAvg').textContent = `${avgThreePoint}%`;
        document.getElementById('teamFreeThrowAvg').textContent = `${avgFreeThrow}%`;
        document.getElementById('teamTotalWorkouts').textContent = totalWorkouts;
    }

    // Charts (replaced with simple text displays)
    updateCharts() {
        this.updateTopShooters();
        this.updateWorkoutDisplay();
    }

    updateTopShooters() {
        const container = document.getElementById('topShooters');
        if (!container) return;
        
        if (this.players.length === 0) {
            container.innerHTML = '<p class="text-muted">No players available</p>';
            return;
        }
        
        const sortSelect = document.getElementById('leaderboardSort');
        const sortBy = sortSelect ? sortSelect.value : 'totalPoints';

        // Aggregate stats for each player
        const rows = this.players.map(player => {
            const entries = this.stats.filter(s => s.playerId === player.id);
            const three = this.calculatePlayerStats(entries, 'threePoint');
            const two = this.calculatePlayerStats(entries, 'twoPoint');
            const ft = this.calculatePlayerStats(entries, 'freeThrow');
            const totalPoints = (three.makes * 3) + (two.makes * 2) + (ft.makes * 1);
            return {
                id: player.id,
                name: player.name,
                position: player.position,
                photo: player.photo,
                three,
                two,
                ft,
                totalPoints
            };
        });

        // Sort
        rows.sort((a, b) => {
            if (sortBy === 'threes') return b.three.makes - a.three.makes;
            if (sortBy === 'twos') return b.two.makes - a.two.makes;
            if (sortBy === 'freeThrows') return b.ft.makes - a.ft.makes;
            return b.totalPoints - a.totalPoints; // totalPoints default
        });

        const top = rows.slice(0, 5);

        if (top.every(p => (p.three.makes + p.two.makes + p.ft.makes) === 0)) {
            container.innerHTML = '<p class="text-muted">No shooting data available yet</p>';
            return;
        }

        const rightStat = (p) => {
            if (sortBy === 'threes') return { main: `${p.three.makes}`, sub: `${p.three.makes}/${p.three.attempts} 3PA` };
            if (sortBy === 'twos') return { main: `${p.two.makes}`, sub: `${p.two.makes}/${p.two.attempts} 2PA` };
            if (sortBy === 'freeThrows') return { main: `${p.ft.makes}`, sub: `${p.ft.makes}/${p.ft.attempts} FTA` };
            return { main: `${p.totalPoints}`, sub: `${p.three.makes}x3 • ${p.two.makes}x2 • ${p.ft.makes}x1` };
        };

        container.innerHTML = `
            <div class="leaderboard">
                ${top.map((player, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏀';
                    const isCurrentPlayer = player.id === this.currentPlayer;
                    const highlightClass = isCurrentPlayer ? 'bg-light border border-primary' : '';
                    const stat = rightStat(player);
                    return `
                        <div class="d-flex justify-content-between align-items-center p-2 mb-2 rounded ${highlightClass}" style="border-left: 4px solid ${isCurrentPlayer ? '#8B0000' : '#dee2e6'};">
                            <div class="d-flex align-items-center">
                                <span class="me-2" style="font-size: 1.2rem;">${medal}</span>
                                <div class="me-3">
                                    ${player.photo && player.photo.length > 0 ? 
                                        `<img src="${player.photo}" alt="${player.name}" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">` :
                                        `<div class="rounded-circle bg-secondary d-flex flex-column align-items-center justify-content-center text-white" style="width: 40px; height: 40px; font-size: 1.2rem;">
                                            <div style="font-size: 1.2rem; line-height: 1;">${player.name.charAt(0).toUpperCase()}</div>
                                            <div style="font-size: 0.6rem; line-height: 1; margin-top: 1px;">${player.position}</div>
                                        </div>`
                                    }
                                </div>
                                <div>
                                    <div class="fw-bold">${player.name}</div>
                                    <small class="text-muted">${player.position}</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <div class="fw-bold text-success">${stat.main}</div>
                                <small class="text-muted">${stat.sub}</small>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    updateWorkoutDisplay() {
        const container = document.getElementById('workoutChart');
        if (!container) return;
        
        const isAll = this.currentPlayer === 'all';
        const playerWorkouts = isAll ? this.workouts : this.workouts.filter(w => w.playerId === this.currentPlayer);
        const last7Days = this.getLast7Days();
        
        const workoutCounts = last7Days.map(date => {
            return playerWorkouts.filter(w => w.date === date).length;
        });
        
        const totalWorkouts = workoutCounts.reduce((sum, count) => sum + count, 0);
        
        container.innerHTML = `
            <div class="text-center">
                <h6 class="text-muted">Last 7 Days</h6>
                <div class="display-6 text-primary mb-2">${totalWorkouts}</div>
                <p class="text-muted">Total Workouts</p>
                <div class="row g-2">
                    ${last7Days.map((date, index) => `
                        <div class="col">
                            <div class="badge ${workoutCounts[index] > 0 ? 'bg-success' : 'bg-secondary'}">
                                ${new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div class="small text-muted">${workoutCounts[index]}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Authentication Helper
    async getCurrentUser() {
        try {
            const userEmail = localStorage.getItem('tideHoopsUserEmail');
            if (!userEmail) {
                return null;
            }
            
            const response = await fetch(`${this.API_BASE}/api/Player/email/${encodeURIComponent(userEmail)}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Lifting Features
    async initLifting() {
        // Populate player filters/selects
        this.updateLiftingPlayerFilters();
        this.setDefaultLiftingDates();
        // Load exercises
        await this.loadExercises();
        // Load workouts
        await this.loadLiftingWorkouts();
        // Hook up events
        this.setupLiftingEvents();
        // Set default lifting form values
        const dateInput = document.getElementById('liftingDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        const playerSelect = document.getElementById('liftingPlayerSelect');
        if (playerSelect && this.currentPlayer) {
            playerSelect.value = this.currentPlayer;
        }
        const setsContainer = document.getElementById('liftingSetsContainer');
        if (setsContainer && setsContainer.children.length === 0) {
            this.addLiftingSetRow();
        }
        // Initial render
        this.renderLiftingQuickStats();
        this.renderLiftingHistory();
        this.renderLiftingProgress();
    }

    updateLiftingPlayerFilters() {
        const filterSelect = document.getElementById('liftingPlayerFilter');
        const formSelect = document.getElementById('liftingPlayerSelect');
        if (!filterSelect || !formSelect) return;
        const options = this.players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        filterSelect.innerHTML = '<option value="all">All Players</option>' + options;
        formSelect.innerHTML = options;
    }

    setDefaultLiftingDates() {
        const start = document.getElementById('liftingStartDate');
        const end = document.getElementById('liftingEndDate');
        if (!start || !end) return;
        const today = new Date();
        const past = new Date();
        past.setDate(today.getDate() - 30);
        start.value = past.toISOString().split('T')[0];
        end.value = today.toISOString().split('T')[0];
        this.lifting.filters.startDate = start.value;
        this.lifting.filters.endDate = end.value;
    }

    setupLiftingEvents() {
        const filterBtn = document.getElementById('liftingFilterBtn');
        const playerFilter = document.getElementById('liftingPlayerFilter');
        const start = document.getElementById('liftingStartDate');
        const end = document.getElementById('liftingEndDate');
        const addSetBtn = document.getElementById('addSetBtn');
        const form = document.getElementById('liftingWorkoutForm');
        const clearBtn = document.getElementById('clearLiftingForm');
        const manageExercisesBtn = document.getElementById('manageExercisesBtn');

        if (filterBtn) {
            filterBtn.addEventListener('click', async () => {
                this.lifting.filters.playerId = playerFilter.value;
                this.lifting.filters.startDate = start.value || null;
                this.lifting.filters.endDate = end.value || null;
                await this.loadLiftingWorkouts();
                this.renderLiftingQuickStats();
                this.renderLiftingHistory();
                this.renderLiftingProgress();
            });
        }
        if (addSetBtn) {
            addSetBtn.addEventListener('click', () => this.addLiftingSetRow());
        }
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitLiftingWorkout();
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearLiftingForm());
        }
        if (manageExercisesBtn) {
            manageExercisesBtn.addEventListener('click', () => this.openExerciseLibrary());
        }
    }

    async loadExercises() {
        try {
            const res = await fetch(`${this.API_BASE}/api/Exercise`);
            if (res.ok) {
                this.lifting.exercises = await res.json();
            } else {
                this.lifting.exercises = [];
            }
        } catch (e) {
            console.error('Error loading exercises', e);
            this.lifting.exercises = [];
        }
    }

    async loadLiftingWorkouts() {
        const params = new URLSearchParams();
        const f = this.lifting.filters;
        if (f.playerId && f.playerId !== 'all') params.append('playerId', f.playerId);
        if (f.startDate) params.append('startDate', f.startDate);
        if (f.endDate) params.append('endDate', f.endDate);
        try {
            const res = await fetch(`${this.API_BASE}/api/Workout?${params.toString()}`);
            if (res.ok) {
                this.lifting.workouts = await res.json();
            } else {
                this.lifting.workouts = [];
            }
        } catch (e) {
            console.error('Error loading workouts', e);
            this.lifting.workouts = [];
        }
    }

    addLiftingSetRow() {
        const container = document.getElementById('liftingSetsContainer');
        if (!container) return;
        const idx = container.children.length + 1;
        const exerciseOptions = this.lifting.exercises.map(ex => `<option value="${ex.id}">${ex.name}${ex.category ? ' (' + ex.category + ')' : ''}</option>`).join('');
        const row = document.createElement('div');
        row.className = 'row g-2 align-items-end mb-2';
        row.innerHTML = `
            <div class="col-md-5">
                <label class="form-label">Exercise</label>
                <select class="form-select lifting-exercise" required>${exerciseOptions}</select>
            </div>
            <div class="col-md-2">
                <label class="form-label">Set</label>
                <input type="number" class="form-control lifting-setnum" min="1" value="${idx}" required>
            </div>
            <div class="col-md-2">
                <label class="form-label">Reps</label>
                <input type="number" class="form-control lifting-reps" min="1" value="8" required>
            </div>
            <div class="col-md-2">
                <label class="form-label">Weight (lbs)</label>
                <input type="number" step="0.5" class="form-control lifting-weight" min="0" value="135" required>
            </div>
            <div class="col-md-1 d-grid">
                <button type="button" class="btn btn-secondary lifting-remove">X</button>
            </div>
        `;
        row.querySelector('.lifting-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    }

    clearLiftingForm() {
        const form = document.getElementById('liftingWorkoutForm');
        const sets = document.getElementById('liftingSetsContainer');
        const date = document.getElementById('liftingDate');
        const notes = document.getElementById('liftingNotes');
        if (form) form.reset();
        if (sets) sets.innerHTML = '';
        if (date) date.value = new Date().toISOString().split('T')[0];
        if (notes) notes.value = '';
    }

    async submitLiftingWorkout() {
        const playerId = document.getElementById('liftingPlayerSelect').value;
        const date = document.getElementById('liftingDate').value;
        const notes = document.getElementById('liftingNotes').value.trim();
        const setsContainer = document.getElementById('liftingSetsContainer');
        const setRows = Array.from(setsContainer.querySelectorAll('.row'));
        if (!playerId || !date || setRows.length === 0) {
            this.showMessage('Please select player, date, and add at least one set.', 'error');
            return;
        }
        const sets = setRows.map(r => ({
            exerciseId: parseInt(r.querySelector('.lifting-exercise').value),
            setNumber: parseInt(r.querySelector('.lifting-setnum').value) || 1,
            reps: parseInt(r.querySelector('.lifting-reps').value) || 0,
            weight: parseFloat(r.querySelector('.lifting-weight').value) || 0
        }));
        const payload = { playerId: parseInt(playerId), date: new Date(date).toISOString(), notes: notes || null, sets };
        try {
            const res = await fetch(`${this.API_BASE}/api/Workout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to save workout');
            await this.loadLiftingWorkouts();
            this.renderLiftingQuickStats();
            this.renderLiftingHistory();
            this.renderLiftingProgress();
            this.clearLiftingForm();
            this.showMessage('Workout saved!', 'success');
        } catch (e) {
            console.error(e);
            this.showMessage('Failed to save workout.', 'error');
        }
    }

    renderLiftingQuickStats() {
        const totalEl = document.getElementById('liftingTotalWorkouts');
        const volEl = document.getElementById('liftingTotalVolume');
        const avgEl = document.getElementById('liftingAvgWeight');
        const exEl = document.getElementById('liftingExerciseCount');
        const workouts = this.lifting.workouts || [];
        const allSets = workouts.flatMap(w => w.sets || []);
        const totalVolume = allSets.reduce((sum, s) => sum + (s.reps * s.weight), 0);
        const avgWeight = allSets.length > 0 ? (allSets.reduce((sum, s) => sum + s.weight, 0) / allSets.length) : 0;
        const exerciseIds = new Set(allSets.map(s => s.exerciseId));
        if (totalEl) totalEl.textContent = workouts.length;
        if (volEl) volEl.textContent = Math.round(totalVolume).toString();
        if (avgEl) avgEl.textContent = Math.round(avgWeight).toString();
        if (exEl) exEl.textContent = exerciseIds.size.toString();
    }

    renderLiftingHistory() {
        const container = document.getElementById('liftingWorkoutHistory');
        if (!container) return;
        const workouts = this.lifting.workouts || [];
        if (workouts.length === 0) {
            container.innerHTML = '<p class="text-muted">No workouts yet</p>';
            return;
        }
        container.innerHTML = workouts.map(w => {
            const sets = (w.sets || []).sort((a,b) => a.setNumber - b.setNumber).map(s => {
                const ex = s.exercise || this.lifting.exercises.find(e => e.id === s.exerciseId);
                const name = ex ? ex.name : `Exercise #${s.exerciseId}`;
                return `<span class="badge bg-secondary me-1 mb-1">${name}: ${s.reps} x ${s.weight}</span>`;
            }).join('');
            const player = this.players.find(p => p.id === (w.playerId?.toString?.() || w.playerId));
            const pname = player ? player.name : `Player #${w.playerId}`;
            return `
                <div class="workout-item">
                    <div class="d-flex justify-content-between">
                        <h5 class="mb-2">${pname} • ${this.formatDate(w.date)}</h5>
                    </div>
                    <div class="mb-2">${sets}</div>
                    ${w.notes ? `<div><small class="text-muted">Notes: ${w.notes}</small></div>` : ''}
                </div>
            `;
        }).join('');
    }

    renderLiftingProgress() {
        const container = document.getElementById('liftingProgressChart');
        if (!container) return;
        const workouts = this.lifting.workouts || [];
        const seriesMap = new Map();
        workouts.forEach(w => (w.sets || []).forEach(s => {
            const key = s.exercise?.name || s.exerciseId;
            if (!seriesMap.has(key)) seriesMap.set(key, []);
            seriesMap.get(key).push({ date: w.date, weight: s.weight });
        }));
        const seriesHtml = Array.from(seriesMap.entries()).slice(0, 3).map(([name, points]) => {
            points.sort((a,b) => new Date(a.date) - new Date(b.date));
            const last = points[points.length - 1]?.weight ?? 0;
            const first = points[0]?.weight ?? 0;
            const diff = Math.round((last - first) * 10) / 10;
            return `<div class="mb-2"><strong>${name}</strong>: ${first} → ${last} (${diff >= 0 ? '+' : ''}${diff})</div>`;
        }).join('');
        container.innerHTML = seriesHtml || '<p class="text-muted">Add workouts to see progress</p>';
    }

    openExerciseLibrary() {
        const modalEl = document.getElementById('exerciseLibraryModal');
        if (!modalEl) return;
        this.renderExerciseList();
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
        const addBtn = document.getElementById('addExerciseBtn');
        if (addBtn) {
            addBtn.onclick = async () => {
                const name = document.getElementById('exerciseName').value.trim();
                const category = document.getElementById('exerciseCategory').value.trim();
                if (!name) return;
                try {
                    const res = await fetch(`${this.API_BASE}/api/Exercise`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, category: category || null })
                    });
                    if (!res.ok) throw new Error('Failed');
                    await this.loadExercises();
                    this.renderExerciseList();
                    // refresh set rows options
                    document.querySelectorAll('#liftingSetsContainer select.lifting-exercise').forEach(sel => {
                        const val = sel.value;
                        sel.innerHTML = this.lifting.exercises.map(ex => `<option value="${ex.id}">${ex.name}${ex.category ? ' (' + ex.category + ')' : ''}</option>`).join('');
                        sel.value = val;
                    });
                    document.getElementById('exerciseName').value = '';
                    document.getElementById('exerciseCategory').value = '';
                } catch (e) {
                    console.error(e);
                    alert('Failed to add exercise');
                }
            };
        }
    }

    renderExerciseList() {
        const list = document.getElementById('exerciseList');
        if (!list) return;
        if (this.lifting.exercises.length === 0) {
            list.innerHTML = '<p class="text-muted">No exercises yet. Add one above.</p>';
            return;
        }
        list.innerHTML = this.lifting.exercises.map(ex => `
            <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                <div>
                    <div class="fw-bold">${ex.name}</div>
                    ${ex.category ? `<small class="text-muted">${ex.category}</small>` : ''}
                </div>
                <button class="btn btn-sm btn-outline-danger" data-ex-id="${ex.id}">Delete</button>
            </div>
        `).join('');
        list.querySelectorAll('button[data-ex-id]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-ex-id');
                if (!confirm('Delete this exercise?')) return;
                try {
                    const res = await fetch(`${this.API_BASE}/api/Exercise/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Failed');
                    await this.loadExercises();
                    this.renderExerciseList();
                } catch (e) {
                    console.error(e);
                    alert('Failed to delete exercise');
                }
            });
        });
    }

    // Utility Functions
    calculatePlayerStats(stats, type) {
        let makes = 0;
        let attempts = 0;
        
        stats.forEach(stat => {
            if (type === 'threePoint') {
                makes += stat.threePointMakes;
                attempts += stat.threePointAttempts;
            } else if (type === 'twoPoint') {
                makes += (stat.twoPointMakes || 0);
                attempts += (stat.twoPointAttempts || 0);
            } else if (type === 'freeThrow') {
                makes += stat.freeThrowMakes;
                attempts += stat.freeThrowAttempts;
            }
        });
        
        return {
            makes,
            attempts,
            percentage: this.calculatePercentage(makes, attempts)
        };
    }

    calculatePercentage(makes, attempts) {
        return attempts > 0 ? Math.round((makes / attempts) * 100) : 0;
    }

    calculateTrend(stats, type) {
        if (stats.length < 2) return 'No trend data';
        
        const recent = stats.slice(0, 3);
        const older = stats.slice(3, 6);
        
        if (older.length === 0) return 'Insufficient data';
        
        const recentAvg = this.calculatePlayerStats(recent, type).percentage;
        const olderAvg = this.calculatePlayerStats(older, type).percentage;
        
        const diff = recentAvg - olderAvg;
        if (diff > 5) return '📈 Improving';
        if (diff < -5) return '📉 Declining';
        return '➡️ Stable';
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }

    getLast30Days() {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatWorkoutType(type) {
        const types = {
            'shooting': 'Shooting Practice',
            'conditioning': 'Conditioning',
            'skills': 'Skills Training',
            'game': 'Game'
        };
        return types[type] || type;
    }

    formatGameType(type) {
        const types = {
            'practice': 'Practice',
            'scrimmage': 'Scrimmage',
            'game': 'Official Game'
        };
        return types[type] || type;
    }

    validateStatsInput(makesInput, attemptsInputId) {
        const makes = parseInt(makesInput.value) || 0;
        const attempts = parseInt(document.getElementById(attemptsInputId).value) || 0;
        
        if (makes > attempts) {
            makesInput.value = attempts;
        }
    }

    showMessage(text, type) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Login Page Feature - Handle logout
    handleLogout() {
        // Clear authentication data
        localStorage.removeItem('tideHoopsAuthenticated');
        localStorage.removeItem('tideHoopsUserEmail');
        localStorage.removeItem('tideHoopsLoginTime');
        
        // Show logout message
        this.showMessage('Logged out successfully!', 'success');
        
        // Redirect to login page after short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    // Player Comparison Methods
    updateComparisonSelects() {
        const select1 = document.getElementById('comparePlayer1');
        const select2 = document.getElementById('comparePlayer2');
        
        // Clear existing options
        select1.innerHTML = '<option value="">Choose a player...</option>';
        select2.innerHTML = '<option value="">Choose a player...</option>';
        
        // Add players to both selects
        this.players.forEach(player => {
            const option1 = document.createElement('option');
            option1.value = player.id;
            option1.textContent = `${player.name} (${player.position})`;
            select1.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = player.id;
            option2.textContent = `${player.name} (${player.position})`;
            select2.appendChild(option2);
        });
    }

    updateComparisonButton() {
        const player1 = document.getElementById('comparePlayer1').value;
        const player2 = document.getElementById('comparePlayer2').value;
        const compareBtn = document.getElementById('comparePlayersBtn');
        
        if (player1 && player2 && player1 !== player2) {
            compareBtn.disabled = false;
        } else {
            compareBtn.disabled = true;
        }
    }

    comparePlayers() {
        const player1Id = document.getElementById('comparePlayer1').value;
        const player2Id = document.getElementById('comparePlayer2').value;
        
        if (!player1Id || !player2Id || player1Id === player2Id) {
            this.showMessage('Please select two different players to compare.', 'error');
            return;
        }

        const player1 = this.players.find(p => p.id === player1Id);
        const player2 = this.players.find(p => p.id === player2Id);

        if (!player1 || !player2) {
            this.showMessage('One or both players not found.', 'error');
            return;
        }

        // Calculate stats for both players
        const player1Stats = this.calculatePlayerComparisonStats(player1Id);
        const player2Stats = this.calculatePlayerComparisonStats(player2Id);

        // Display comparison
        this.displayComparison(player1, player2, player1Stats, player2Stats);
        
        // Show clear button
        document.getElementById('clearComparisonBtn').style.display = 'inline-block';
    }

    calculatePlayerComparisonStats(playerId) {
        const playerStatEntries = this.stats.filter(s => s.playerId === playerId);
        
        const threePointStats = this.calculatePlayerStats(playerStatEntries, 'threePoint');
        const twoPointStats = this.calculatePlayerStats(playerStatEntries, 'twoPoint');
        const freeThrowStats = this.calculatePlayerStats(playerStatEntries, 'freeThrow');
        
        // Calculate averages
        const totalAssists = playerStatEntries.reduce((sum, stat) => sum + (stat.assists || 0), 0);
        const totalRebounds = playerStatEntries.reduce((sum, stat) => sum + (stat.rebounds || 0), 0);
        const totalGames = playerStatEntries.length;
        
        return {
            threePoint: threePointStats,
            twoPoint: twoPointStats,
            freeThrow: freeThrowStats,
            assists: {
                total: totalAssists,
                average: totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : 0
            },
            rebounds: {
                total: totalRebounds,
                average: totalGames > 0 ? (totalRebounds / totalGames).toFixed(1) : 0
            },
            gamesPlayed: totalGames
        };
    }

    displayComparison(player1, player2, stats1, stats2) {
        const container = document.getElementById('comparisonResults');
        
        container.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card comparison-card">
                        <div class="card-header text-center">
                            <h5 class="card-title mb-0">${player1.name}</h5>
                            <small class="text-muted">${player1.position}</small>
                        </div>
                        <div class="card-body">
                            ${this.renderPlayerComparisonStats(stats1, stats2, player1.name)}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card comparison-card">
                        <div class="card-header text-center">
                            <h5 class="card-title mb-0">${player2.name}</h5>
                            <small class="text-muted">${player2.position}</small>
                        </div>
                        <div class="card-body">
                            ${this.renderPlayerComparisonStats(stats2, stats1, player2.name)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.style.display = 'block';
    }

    renderPlayerComparisonStats(playerStats, opponentStats, playerName) {
        const stats = [
            {
                label: '3-Point %',
                value: `${playerStats.threePoint.percentage}%`,
                opponentValue: `${opponentStats.threePoint.percentage}%`,
                isBetter: playerStats.threePoint.percentage > opponentStats.threePoint.percentage,
                isNeutral: playerStats.threePoint.percentage === 0 && opponentStats.threePoint.percentage === 0,
                details: `${playerStats.threePoint.makes}/${playerStats.threePoint.attempts}`
            },
            {
                label: '2-Point %',
                value: `${playerStats.twoPoint.percentage}%`,
                opponentValue: `${opponentStats.twoPoint.percentage}%`,
                isBetter: playerStats.twoPoint.percentage > opponentStats.twoPoint.percentage,
                isNeutral: playerStats.twoPoint.percentage === 0 && opponentStats.twoPoint.percentage === 0,
                details: `${playerStats.twoPoint.makes}/${playerStats.twoPoint.attempts}`
            },
            {
                label: 'Free Throw %',
                value: `${playerStats.freeThrow.percentage}%`,
                opponentValue: `${opponentStats.freeThrow.percentage}%`,
                isBetter: playerStats.freeThrow.percentage > opponentStats.freeThrow.percentage,
                isNeutral: playerStats.freeThrow.percentage === 0 && opponentStats.freeThrow.percentage === 0,
                details: `${playerStats.freeThrow.makes}/${playerStats.freeThrow.attempts}`
            },
            {
                label: 'Assists/Game',
                value: playerStats.assists.average,
                opponentValue: opponentStats.assists.average,
                isBetter: parseFloat(playerStats.assists.average) > parseFloat(opponentStats.assists.average),
                isNeutral: parseFloat(playerStats.assists.average) === 0 && parseFloat(opponentStats.assists.average) === 0,
                details: `Total: ${playerStats.assists.total}`
            },
            {
                label: 'Rebounds/Game',
                value: playerStats.rebounds.average,
                opponentValue: opponentStats.rebounds.average,
                isBetter: parseFloat(playerStats.rebounds.average) > parseFloat(opponentStats.rebounds.average),
                isNeutral: parseFloat(playerStats.rebounds.average) === 0 && parseFloat(opponentStats.rebounds.average) === 0,
                details: `Total: ${playerStats.rebounds.total}`
            },
            {
                label: 'Workouts',
                value: playerStats.gamesPlayed,
                opponentValue: opponentStats.gamesPlayed,
                isBetter: playerStats.gamesPlayed > opponentStats.gamesPlayed,
                isNeutral: playerStats.gamesPlayed === 0 && opponentStats.gamesPlayed === 0,
                details: ''
            }
        ];

        return stats.map(stat => {
            let statClass = 'worse';
            let badgeClass = 'bg-secondary';
            
            if (stat.isNeutral) {
                statClass = 'neutral';
                badgeClass = 'bg-secondary';
            } else if (stat.isBetter) {
                statClass = 'better';
                badgeClass = 'bg-success';
            }
            
            return `
                <div class="comparison-stat ${statClass}">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold">${stat.label}</span>
                        <span class="badge ${badgeClass} comparison-badge">
                            ${stat.value}
                        </span>
                    </div>
                    ${stat.details ? `<small class="text-muted">${stat.details}</small>` : ''}
                </div>
            `;
        }).join('');
    }

    clearComparison() {
        document.getElementById('comparePlayer1').value = '';
        document.getElementById('comparePlayer2').value = '';
        document.getElementById('comparisonResults').style.display = 'none';
        document.getElementById('clearComparisonBtn').style.display = 'none';
        document.getElementById('comparePlayersBtn').disabled = true;
    }
}

// Initialize the application
const tracker = new BasketballTracker();
