// Global state
let players = [];
let lifts = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadPlayers();
    loadLifts();
});

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('[data-section]').forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });

    // Modal buttons
    document.getElementById('addPlayerBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('playerModal'));
        modal.show();
        document.getElementById('playerForm').reset();
    });

    document.getElementById('addLiftBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('liftModal'));
        modal.show();
        document.getElementById('liftForm').reset();
        populatePlayerSelect();
    });

    // Form submissions
    document.getElementById('savePlayerBtn').addEventListener('click', handlePlayerSubmit);
    document.getElementById('saveLiftBtn').addEventListener('click', handleLiftSubmit);
}

// Navigation
function switchSection(sectionName) {
    // Update nav buttons
    document.querySelectorAll('[data-section]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionName);
    });

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('active', section.id === sectionName);
    });

    // Load data for the section
    if (sectionName === 'weight-lifting') {
        loadLifts();
    } else if (sectionName === 'workouts-stats') {
        updateWorkoutsStats();
    } else if (sectionName === 'coach') {
        updateCoachView();
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`http://localhost:5038/api${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('Error connecting to server. Please make sure the API is running.', 'error');
        return null;
    }
}

// Player Management
async function loadPlayers() {
    const data = await apiCall('/Player');
    if (data) {
        players = data;
        renderPlayers();
        updatePlayerSelect();
    }
}

function renderPlayers() {
    const playersGrid = document.getElementById('playersGrid');
    
    if (players.length === 0) {
        playersGrid.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-people"></i>
                    <h5>No Players Yet</h5>
                    <p>Add your first player to get started!</p>
                </div>
            </div>
        `;
        return;
    }

    playersGrid.innerHTML = players.map(player => `
        <div class="col-md-6 col-lg-4">
            <div class="player-card">
                <div class="player-header">
                    <div class="player-avatar">
                        ${player.firstName.charAt(0)}${player.lastName.charAt(0)}
                    </div>
                    <div class="player-info">
                        <h5>${player.firstName} ${player.lastName}</h5>
                        <div class="player-position">${player.position}</div>
                        <div class="player-email">${player.email}</div>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="viewPlayerLifts(${player.id})">
                        <i class="bi bi-dumbbell"></i> View Lifts
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deletePlayer(${player.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updatePlayerSelect() {
    const select = document.getElementById('playerSelect');
    select.innerHTML = '<option value="current">Current Player</option>';
    
    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `${player.firstName} ${player.lastName}`;
        select.appendChild(option);
    });
}

async function handlePlayerSubmit() {
    const form = document.getElementById('playerForm');
    const formData = new FormData(form);
    
    const playerData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        position: formData.get('position'),
        photoUrl: formData.get('photoUrl') || null
    };

    const result = await apiCall('/Player', {
        method: 'POST',
        body: JSON.stringify(playerData)
    });

    if (result) {
        showNotification('Player added successfully!', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('playerModal'));
        modal.hide();
        loadPlayers();
    }
}

async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) {
        return;
    }

    const result = await apiCall(`/Player/${playerId}`, {
        method: 'DELETE'
    });

    if (result !== null) {
        showNotification('Player deleted successfully!', 'success');
        loadPlayers();
        loadLifts();
    }
}

// Lift Management
function loadLifts() {
    const storedLifts = localStorage.getItem('basketballLifts');
    lifts = storedLifts ? JSON.parse(storedLifts) : [];
    renderLifts();
}

function renderLifts() {
    const liftsContent = document.getElementById('liftsContent');
    
    if (lifts.length === 0) {
        liftsContent.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-dumbbell"></i>
                    <h5>No Lifts Logged</h5>
                    <p>Start tracking your strength training progress!</p>
                </div>
            </div>
        `;
        return;
    }

    liftsContent.innerHTML = lifts.map(lift => `
        <div class="col-md-6 col-lg-4">
            <div class="lift-card">
                <div class="lift-header">
                    <div class="lift-exercise">${lift.exerciseName}</div>
                    <div class="lift-date">${new Date(lift.createdAt).toLocaleDateString()}</div>
                </div>
                <div class="lift-player">${lift.playerName}</div>
                <div class="lift-stats">
                    <div class="stat">
                        <div class="stat-value">${lift.weight}</div>
                        <div class="stat-label">Weight (lbs)</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${lift.reps}</div>
                        <div class="stat-label">Reps</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${lift.sets}</div>
                        <div class="stat-label">Sets</div>
                    </div>
                </div>
                ${lift.notes ? `<div class="lift-notes">${lift.notes}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function populatePlayerSelect() {
    const select = document.getElementById('liftPlayer');
    select.innerHTML = '<option value="">Select Player</option>';
    
    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `${player.firstName} ${player.lastName}`;
        select.appendChild(option);
    });
}

function handleLiftSubmit() {
    const form = document.getElementById('liftForm');
    const formData = new FormData(form);
    
    const playerId = parseInt(formData.get('playerId'));
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
        showNotification('Please select a valid player', 'error');
        return;
    }

    const liftData = {
        id: Date.now(),
        playerId: playerId,
        playerName: `${player.firstName} ${player.lastName}`,
        exerciseName: formData.get('exerciseName'),
        weight: parseFloat(formData.get('weight')),
        reps: parseInt(formData.get('reps')),
        sets: parseInt(formData.get('sets')),
        notes: formData.get('notes') || '',
        createdAt: new Date().toISOString()
    };

    lifts.unshift(liftData);
    localStorage.setItem('basketballLifts', JSON.stringify(lifts));
    
    showNotification('Lift logged successfully!', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('liftModal'));
    modal.hide();
    renderLifts();
    updateWorkoutsStats();
}

function viewPlayerLifts(playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const playerLifts = lifts.filter(lift => lift.playerId === playerId);
    
    if (playerLifts.length === 0) {
        showNotification(`${player.firstName} ${player.lastName} has no lifts logged yet.`, 'info');
        return;
    }

    switchSection('weight-lifting');
    
    const originalLifts = [...lifts];
    lifts = playerLifts;
    renderLifts();
    
    setTimeout(() => {
        lifts = originalLifts;
        renderLifts();
    }, 5000);
}

// Workouts & Stats
function updateWorkoutsStats() {
    const content = document.getElementById('workoutsStatsContent');
    
    if (lifts.length === 0) {
        content.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-graph-up"></i>
                    <h5>No Workout Data</h5>
                    <p>Log some lifts to see your workout statistics!</p>
                </div>
            </div>
        `;
        return;
    }

    const totalLifts = lifts.length;
    const totalWeight = lifts.reduce((sum, lift) => sum + (lift.weight * lift.reps * lift.sets), 0);
    const uniquePlayers = new Set(lifts.map(lift => lift.playerId)).size;
    const exercises = [...new Set(lifts.map(lift => lift.exerciseName))];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentLifts = lifts.filter(lift => new Date(lift.createdAt) > weekAgo);

    content.innerHTML = `
        <div class="col-md-6 col-lg-4">
            <div class="progress-card">
                <h5>Total Lifts</h5>
                <div class="progress-value">${totalLifts}</div>
                <p>All time logged</p>
            </div>
        </div>
        <div class="col-md-6 col-lg-4">
            <div class="progress-card">
                <h5>Total Volume</h5>
                <div class="progress-value">${Math.round(totalWeight)}</div>
                <p>Pounds lifted</p>
            </div>
        </div>
        <div class="col-md-6 col-lg-4">
            <div class="progress-card">
                <h5>Active Players</h5>
                <div class="progress-value">${uniquePlayers}</div>
                <p>Tracking progress</p>
            </div>
        </div>
        <div class="col-md-6 col-lg-4">
            <div class="progress-card">
                <h5>This Week</h5>
                <div class="progress-value">${recentLifts.length}</div>
                <p>Recent lifts</p>
            </div>
        </div>
        <div class="col-md-6 col-lg-4">
            <div class="progress-card">
                <h5>Exercises</h5>
                <div class="progress-value">${exercises.length}</div>
                <p>Different types</p>
            </div>
        </div>
        <div class="col-md-6 col-lg-4">
            <div class="progress-card">
                <h5>Top Exercise</h5>
                <div class="progress-value">${getMostPopularExercise()}</div>
                <p>Most logged</p>
            </div>
        </div>
    `;
}

function getMostPopularExercise() {
    const exerciseCounts = {};
    lifts.forEach(lift => {
        exerciseCounts[lift.exerciseName] = (exerciseCounts[lift.exerciseName] || 0) + 1;
    });
    
    const mostPopular = Object.entries(exerciseCounts)
        .sort(([,a], [,b]) => b - a)[0];
    
    return mostPopular ? mostPopular[0] : 'None';
}

// Coach View
function updateCoachView() {
    const content = document.getElementById('coachContent');
    
    content.innerHTML = `
        <div class="col-12">
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Player Overview</h5>
                        </div>
                        <div class="card-body">
                            <p class="card-text">Total Players: <strong>${players.length}</strong></p>
                            <p class="card-text">Total Lifts Logged: <strong>${lifts.length}</strong></p>
                            <p class="card-text">Most Active Player: <strong>${getMostActivePlayer()}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Recent Activity</h5>
                        </div>
                        <div class="card-body">
                            ${getRecentActivity()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getMostActivePlayer() {
    if (lifts.length === 0) return 'None';
    
    const playerCounts = {};
    lifts.forEach(lift => {
        playerCounts[lift.playerName] = (playerCounts[lift.playerName] || 0) + 1;
    });
    
    const mostActive = Object.entries(playerCounts)
        .sort(([,a], [,b]) => b - a)[0];
    
    return mostActive ? mostActive[0] : 'None';
}

function getRecentActivity() {
    if (lifts.length === 0) return '<p class="text-muted">No recent activity</p>';
    
    const recentLifts = lifts.slice(0, 5);
    return recentLifts.map(lift => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong>${lift.playerName}</strong> - ${lift.exerciseName}
            </div>
            <small class="text-muted">${new Date(lift.createdAt).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}