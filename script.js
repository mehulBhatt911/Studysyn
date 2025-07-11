const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
today.setHours(0, 0, 0, 0);

function getStoredData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function generateCalendar(startDate, endDate, progress = null) {
    let calendarHTML = '';
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let currentDate = new Date(startDate);
    currentDate.setDate(1);
    
    while (currentDate <= endDate) {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        calendarHTML += `<h3 class="month-title">${months[month]} ${year}</h3>`;
        calendarHTML += '<div class="weekdays">' + weekdays.map(day => `<div>${day}</div>`).join('') + '</div>';
        calendarHTML += '<div class="calendar-grid">';
        
        // Add empty cells for days before the first of the month
        const firstDay = new Date(year, month, 1).getDay();
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < offset; i++) {
            calendarHTML += '<div></div>';
        }
        
        while (currentDate.getMonth() === month && currentDate <= endDate) {
            let dayClass = 'calendar-day';
            if (currentDate < today) {
                dayClass = 'past-day';
            } else if (currentDate.toDateString() === today.toDateString()) {
                dayClass = 'current-day';
            } else if (currentDate <= endDate) {
                dayClass = 'future-day';
            }
            if (progress && currentDate >= startDate) {
                const dayIndex = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
                if (dayIndex < progress.length) {
                    if (progress[dayIndex] === 'completed') dayClass = 'completed-day';
                    else if (progress[dayIndex] === 'skipped') dayClass = 'skipped-day';
                    else if (progress[dayIndex] === 'pending') dayClass = 'pending-day';
                }
            }
            calendarHTML += `<div class="${dayClass}">${currentDate.getDate()}</div>`;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        calendarHTML += '</div>';
    }
    return calendarHTML;
}

function renderTrackers() {
    const trackersDiv = document.getElementById('trackers');
    trackersDiv.innerHTML = '';
    const exams = getStoredData('exams');
    const challenges = getStoredData('challenges');

    exams.forEach((exam, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-lg shadow-md card';
        card.innerHTML = `
            <h3 class="text-xl font-medium text-indigo-600">${exam.name}</h3>
            <p class="text-gray-600">Exam on ${new Date(exam.date).toLocaleDateString()}</p>
            <div class="mt-4 flex space-x-2">
                <button onclick="viewCountdown(${index})" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-800">View</button>
                <button onclick="editExam(${index})" class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Edit</button>
                <button onclick="deleteExam(${index})" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete</button>
            </div>
        `;
        trackersDiv.appendChild(card);
    });

    challenges.forEach((challenge, index) => {
        const isCompleted = !challenge.progress.includes('pending');
        const card = document.createElement('div');
        card.className = 'bg-white p-6 rounded-lg shadow-md card';
        card.innerHTML = `
            <h3 class="text-xl font-medium text-indigo-600">${challenge.name}</h3>
            <p class="text-gray-600 flex items-center">
                ${isCompleted ? '<span class="completed-mark">✔</span>' : `${challenge.days} Days Challenge`}
            </p>
            <div class="mt-4 flex space-x-2">
                <button onclick="viewChallenge(${index})" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-800">View</button>
                <button onclick="editChallenge(${index})" class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Edit</button>
                <button onclick="deleteChallenge(${index})" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete</button>
            </div>
        `;
        trackersDiv.appendChild(card);
    });
}

document.getElementById('examForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('examName').value;
    const date = document.getElementById('examDate').value;
    const exams = getStoredData('exams');
    exams.push({ name, date });
    saveData('exams', exams);
    renderTrackers();
    e.target.reset();
});

document.getElementById('challengeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('challengeName').value;
    const days = parseInt(document.getElementById('challengeDays').value);
    const challenges = getStoredData('challenges');
    challenges.push({ name, days, progress: Array(days).fill('pending'), streak: 0, lastUpdated: today.toISOString(), startDate: today.toISOString() });
    saveData('challenges', challenges);
    renderTrackers();
    e.target.reset();
});

function viewCountdown(index) {
    const exams = getStoredData('exams');
    const exam = exams[index];
    const examDate = new Date(exam.date);
    const diffTime = examDate - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calendarHTML = generateCalendar(today, examDate);

    document.body.innerHTML = `
        <div class="container mx-auto p-6">
            <button onclick="window.location.reload()" class="bg-indigo-600 text-white px-4 py-2 rounded mb-6 hover:bg-indigo-800">Back to Home</button>
            <h2 class="text-3xl font-bold mb-4 text-indigo-800">${exam.name} Countdown</h2>
            <p class="text-lg mb-6 text-gray-700">Days Remaining: <span class="font-semibold">${daysLeft}</span></p>
            <div class="calendar-container">${calendarHTML}</div>
        </div>
    `;
}

function viewChallenge(index) {
    const challenges = getStoredData('challenges');
    const challenge = challenges[index];
    const lastUpdated = new Date(challenge.lastUpdated);
    if (lastUpdated < today) {
        const daysMissed = Math.floor((today - lastUpdated) / (1000 * 60 * 60 * 24));
        for (let i = 0; i < daysMissed && challenge.progress.indexOf('pending') !== -1; i++) {
            const nextPending = challenge.progress.indexOf('pending');
            challenge.progress[nextPending] = 'skipped';
            challenge.streak = 0; // Reset streak on skip
        }
        challenge.lastUpdated = today.toISOString();
        saveData('challenges', challenges);
    }

    const startDate = new Date(challenge.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + challenge.days - 1);
    const calendarHTML = generateCalendar(startDate, endDate, challenge.progress);
    const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const canMarkToday = challenge.progress.includes('pending') && today >= startDate && today <= endDate && challenge.progress[dayIndex] === 'pending';
    const canUnmarkToday = dayIndex < challenge.progress.length && challenge.progress[dayIndex] === 'completed' && today.toDateString() === new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000).toDateString();

    document.body.innerHTML = `
        <div class="container mx-auto p-6">
            <button onclick="window.location.reload()" class="bg-indigo-600 text-white px-4 py-2 rounded mb-6 hover:bg-indigo-800">Back to Home</button>
            <h2 class="text-3xl font-bold mb-4 text-indigo-800">${challenge.name}</h2>
            <p class="text-lg mb-6 text-gray-700">Streak: <span class="font-semibold">${challenge.streak} Days</span></p>
            <div class="calendar-container">${calendarHTML}</div>
            <div class="mt-6 flex space-x-4">
                ${canMarkToday ? `<button onclick="markDay(${index}, 'completed')" class="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600">Mark Today Completed</button>` : ''}
                ${canUnmarkToday ? `<button onclick="unmarkDay(${index})" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Unmark Today</button>` : ''}
            </div>
        </div>
    `;
}

function markDay(challengeIndex, status) {
    const challenges = getStoredData('challenges');
    const challenge = challenges[challengeIndex];
    const startDate = new Date(challenge.startDate);
    const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    if (dayIndex < challenge.progress.length && challenge.progress[dayIndex] === 'pending') {
        challenge.progress[dayIndex] = status;
        if (status === 'completed') {
            challenge.streak += 1;
        }
        challenge.lastUpdated = today.toISOString();
        saveData('challenges', challenges);
        viewChallenge(challengeIndex);
    }
}

function unmarkDay(challengeIndex) {
    const challenges = getStoredData('challenges');
    const challenge = challenges[challengeIndex];
    const startDate = new Date(challenge.startDate);
    const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    if (dayIndex < challenge.progress.length && challenge.progress[dayIndex] === 'completed') {
        challenge.progress[dayIndex] = 'pending';
        challenge.streak = Math.max(0, challenge.streak - 1);
        challenge.lastUpdated = today.toISOString();
        saveData('challenges', challenges);
        viewChallenge(challengeIndex);
    }
}

function editExam(index) {
    const exams = getStoredData('exams');
    const exam = exams[index];
    document.body.innerHTML = `
        <div class="container mx-auto p-6">
            <button onclick="window.location.reload()" class="bg-indigo-600 text-white px-4 py-2 rounded mb-6 hover:bg-indigo-800">Back to Home</button>
            <h2 class="text-3xl font-bold mb-4 text-indigo-800">Edit ${exam.name}</h2>
            <form id="editExamForm">
                <input type="text" id="editExamName" value="${exam.name}" class="w-full p-2 mb-2 border rounded focus:ring-2 focus:ring-indigo-300" required>
                <input type="date" id="editExamDate" value="${exam.date}" class="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-indigo-300" required>
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-800">Save Changes</button>
            </form>
        </div>
    `;
    document.getElementById('editExamForm').addEventListener('submit', (e) => {
        e.preventDefault();
        exams[index] = {
            name: document.getElementById('editExamName').value,
            date: document.getElementById('editExamDate').value
        };
        saveData('exams', exams);
        window.location.reload();
    });
}

function editChallenge(index) {
    const challenges = getStoredData('challenges');
    const challenge = challenges[index];
    document.body.innerHTML = `
        <div class="container mx-auto p-6">
            <button onclick="window.location.reload()" class="bg-indigo-600 text-white px-4 py-2 rounded mb-6 hover:bg-indigo-800">Back to Home</button>
            <h2 class="text-3xl font-bold mb-4 text-indigo-800">Edit ${challenge.name}</h2>
            <form id="editChallengeForm">
                <input type="text" id="editChallengeName" value="${challenge.name}" class="w-full p-2 mb-2 border rounded focus:ring-2 focus:ring-indigo-300" required>
                <input type="number" id="editChallengeDays" value="${challenge.days}" min="1" class="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-indigo-300" required>
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-800">Save Changes</button>
            </form>
        </div>
    `;
    document.getElementById('editChallengeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newDays = parseInt(document.getElementById('editChallengeDays').value);
        const newProgress = Array(newDays).fill('pending');
        challenge.progress.forEach((status, i) => {
            if (i < newDays) newProgress[i] = status;
        });
        challenges[index] = {
            name: document.getElementById('editChallengeName').value,
            days: newDays,
            progress: newProgress,
            streak: challenge.streak,
            lastUpdated: challenge.lastUpdated,
            startDate: challenge.startDate
        };
        saveData('challenges', challenges);
        window.location.reload();
    });
}

function deleteExam(index) {
    if (confirm('Are you sure you want to delete this exam countdown?')) {
        const exams = getStoredData('exams');
        exams.splice(index, 1);
        saveData('exams', exams);
        renderTrackers();
    }
}

function deleteChallenge(index) {
    if (confirm('Are you sure you want to delete this challenge?')) {
        const challenges = getStoredData('challenges');
        challenges.splice(index, 1);
        saveData('challenges', challenges);
        renderTrackers();
    }
}

renderTrackers();