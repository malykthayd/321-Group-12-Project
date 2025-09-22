// Basketball Workout Tracker Application
class BasketballTracker {
    constructor() {
        this.currentPlayer = 'current';
        this.players = this.loadPlayers();
        this.workouts = this.loadWorkouts();
        this.stats = this.loadStats();
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePlayerSelect();
        this.updateDashboard();
        this.renderWorkouts();
        this.renderStats();
        this.renderPlayers();
        this.updateTeamOverview();
        this.setDefaultDate();
    }

    // Data Management
    loadPlayers() {
        const saved = localStorage.getItem('basketballPlayers');
        return saved ? JSON.parse(saved) : [
            { id: 'current', name: 'Current Player', position: 'PG' }
        ];
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
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Workout form
        document.getElementById('addWorkoutBtn').addEventListener('click', () => {
            this.toggleWorkoutForm();
        });

        document.getElementById('workoutFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addWorkout();
        });

        document.getElementById('cancelWorkout').addEventListener('click', () => {
            this.toggleWorkoutForm();
        });

        // Stats form
        document.getElementById('addStatsBtn').addEventListener('click', () => {
            this.toggleStatsForm();
        });

        document.getElementById('statsFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStats();
        });

        document.getElementById('cancelStats').addEventListener('click', () => {
            this.toggleStatsForm();
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

        // Player selector
        document.getElementById('playerSelect').addEventListener('change', (e) => {
            this.currentPlayer = e.target.value;
            this.updateDashboard();
            this.renderWorkouts();
            this.renderStats();
        });

        // Input validation for stats
        document.getElementById('threePointMakes').addEventListener('input', (e) => {
            this.validateStatsInput(e.target, 'threePointAttempts');
        });

        document.getElementById('freeThrowMakes').addEventListener('input', (e) => {
            this.validateStatsInput(e.target, 'freeThrowAttempts');
        });
    }

    // Navigation
    switchSection(sectionName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
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
    toggleWorkoutForm() {
        const form = document.getElementById('workoutForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
            this.setDefaultDate('workoutDate');
        }
    }

    toggleStatsForm() {
        const form = document.getElementById('statsForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
            this.setDefaultDate('statsDate');
        }
    }

    togglePlayerForm() {
        const form = document.getElementById('playerForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }

    setDefaultDate(inputId = null) {
        const today = new Date().toISOString().split('T')[0];
        if (inputId) {
            document.getElementById(inputId).value = today;
        } else {
            document.getElementById('workoutDate').value = today;
            document.getElementById('statsDate').value = today;
        }
    }

    // Workout Management
    addWorkout() {
        const form = document.getElementById('workoutFormElement');
        const formData = new FormData(form);
        
        const workout = {
            id: Date.now(),
            playerId: this.currentPlayer,
            date: document.getElementById('workoutDate').value,
            type: document.getElementById('workoutType').value,
            duration: parseInt(document.getElementById('duration').value),
            notes: document.getElementById('notes').value,
            timestamp: new Date().toISOString()
        };

        this.workouts.unshift(workout);
        this.saveWorkouts();
        this.renderWorkouts();
        this.updateDashboard();
        this.toggleWorkoutForm();
        form.reset();
        this.showMessage('Workout added successfully!', 'success');
    }

    renderWorkouts() {
        const container = document.getElementById('workoutsContainer');
        const playerWorkouts = this.workouts.filter(w => w.playerId === this.currentPlayer);
        
        if (playerWorkouts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No workouts recorded yet.</p>';
            return;
        }

        container.innerHTML = playerWorkouts.map(workout => `
            <div class="workout-item">
                <h4>${this.formatWorkoutType(workout.type)} - ${workout.duration} minutes</h4>
                <p><strong>Date:</strong> ${this.formatDate(workout.date)}</p>
                ${workout.notes ? `<p><strong>Notes:</strong> ${workout.notes}</p>` : ''}
                <button class="btn btn-secondary" onclick="tracker.deleteWorkout(${workout.id})" style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.8rem;">Delete</button>
            </div>
        `).join('');
    }

    deleteWorkout(id) {
        this.workouts = this.workouts.filter(w => w.id !== id);
        this.saveWorkouts();
        this.renderWorkouts();
        this.updateDashboard();
        this.showMessage('Workout deleted successfully!', 'success');
    }

    // Statistics Management
    addStats() {
        const form = document.getElementById('statsFormElement');
        
        const stats = {
            id: Date.now(),
            playerId: this.currentPlayer,
            date: document.getElementById('statsDate').value,
            gameType: document.getElementById('gameType').value,
            threePointAttempts: parseInt(document.getElementById('threePointAttempts').value) || 0,
            threePointMakes: parseInt(document.getElementById('threePointMakes').value) || 0,
            freeThrowAttempts: parseInt(document.getElementById('freeThrowAttempts').value) || 0,
            freeThrowMakes: parseInt(document.getElementById('freeThrowMakes').value) || 0,
            timestamp: new Date().toISOString()
        };

        this.stats.unshift(stats);
        this.saveStats();
        this.renderStats();
        this.updateDashboard();
        this.toggleStatsForm();
        form.reset();
        this.showMessage('Statistics added successfully!', 'success');
    }

    renderStats() {
        const container = document.getElementById('statsContainer');
        const playerStats = this.stats.filter(s => s.playerId === this.currentPlayer);
        
        if (playerStats.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No statistics recorded yet.</p>';
            return;
        }

        container.innerHTML = playerStats.map(stat => `
            <div class="stat-item">
                <h4>${this.formatGameType(stat.gameType)} - ${this.formatDate(stat.date)}</h4>
                <p><strong>3-Point:</strong> ${stat.threePointMakes}/${stat.threePointAttempts} (${this.calculatePercentage(stat.threePointMakes, stat.threePointAttempts)}%)</p>
                <p><strong>Free Throws:</strong> ${stat.freeThrowMakes}/${stat.freeThrowAttempts} (${this.calculatePercentage(stat.freeThrowMakes, stat.freeThrowAttempts)}%)</p>
                <button class="btn btn-secondary" onclick="tracker.deleteStats(${stat.id})" style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.8rem;">Delete</button>
            </div>
        `).join('');
    }

    deleteStats(id) {
        this.stats = this.stats.filter(s => s.id !== id);
        this.saveStats();
        this.renderStats();
        this.updateDashboard();
        this.showMessage('Statistics deleted successfully!', 'success');
    }

    // Player Management
    addPlayer() {
        const form = document.getElementById('playerFormElement');
        
        const player = {
            id: Date.now().toString(),
            name: document.getElementById('playerName').value,
            position: document.getElementById('playerPosition').value
        };

        this.players.push(player);
        this.savePlayers();
        this.updatePlayerSelect();
        this.renderPlayers();
        this.updateTeamOverview();
        this.togglePlayerForm();
        form.reset();
        this.showMessage('Player added successfully!', 'success');
    }

    renderPlayers() {
        const container = document.getElementById('playersContainer');
        
        container.innerHTML = this.players.map(player => {
            const playerWorkouts = this.workouts.filter(w => w.playerId === player.id);
            const playerStats = this.stats.filter(s => s.playerId === player.id);
            
            const threePointStats = this.calculatePlayerStats(playerStats, 'threePoint');
            const freeThrowStats = this.calculatePlayerStats(playerStats, 'freeThrow');
            
            return `
                <div class="player-item">
                    <h4>${player.name} (${player.position})</h4>
                    <p><strong>Workouts:</strong> ${playerWorkouts.length}</p>
                    <p><strong>3-Point %:</strong> ${threePointStats.percentage}% (${threePointStats.makes}/${threePointStats.attempts})</p>
                    <p><strong>Free Throw %:</strong> ${freeThrowStats.percentage}% (${freeThrowStats.makes}/${freeThrowStats.attempts})</p>
                    <button class="btn btn-secondary" onclick="tracker.deletePlayer('${player.id}')" style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.8rem;">Delete</button>
                </div>
            `;
        }).join('');
    }

    deletePlayer(id) {
        if (id === 'current') return; // Can't delete current player
        
        this.players = this.players.filter(p => p.id !== id);
        this.workouts = this.workouts.filter(w => w.playerId !== id);
        this.stats = this.stats.filter(s => s.playerId !== id);
        
        this.savePlayers();
        this.saveWorkouts();
        this.saveStats();
        
        this.updatePlayerSelect();
        this.renderPlayers();
        this.updateTeamOverview();
        this.updateDashboard();
        this.renderWorkouts();
        this.renderStats();
        
        this.showMessage('Player deleted successfully!', 'success');
    }

    updatePlayerSelect() {
        const select = document.getElementById('playerSelect');
        select.innerHTML = this.players.map(player => 
            `<option value="${player.id}">${player.name}</option>`
        ).join('');
        select.value = this.currentPlayer;
    }

    // Dashboard Updates
    updateDashboard() {
        const playerWorkouts = this.workouts.filter(w => w.playerId === this.currentPlayer);
        const playerStats = this.stats.filter(s => s.playerId === this.currentPlayer);
        
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

    // Charts
    updateCharts() {
        this.updatePerformanceChart();
        this.updateWorkoutChart();
    }

    updatePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        const playerStats = this.stats.filter(s => s.playerId === this.currentPlayer);
        const recentStats = playerStats.slice(0, 10).reverse();
        
        const labels = recentStats.map(stat => this.formatDate(stat.date));
        const threePointData = recentStats.map(stat => this.calculatePercentage(stat.threePointMakes, stat.threePointAttempts));
        const freeThrowData = recentStats.map(stat => this.calculatePercentage(stat.freeThrowMakes, stat.freeThrowAttempts));
        
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }
        
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '3-Point %',
                    data: threePointData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Free Throw %',
                    data: freeThrowData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateWorkoutChart() {
        const ctx = document.getElementById('workoutChart');
        if (!ctx) return;
        
        const playerWorkouts = this.workouts.filter(w => w.playerId === this.currentPlayer);
        const last30Days = this.getLast30Days();
        
        const workoutCounts = last30Days.map(date => {
            return playerWorkouts.filter(w => w.date === date).length;
        });
        
        if (this.charts.workout) {
            this.charts.workout.destroy();
        }
        
        this.charts.workout = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last30Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Workouts',
                    data: workoutCounts,
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: '#3498db',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
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
}

// Initialize the application
const tracker = new BasketballTracker();
