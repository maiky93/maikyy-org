const API_KEY = 'f0436ea441ee727e737ca8ad122414f4';
const CITY = 'Leiden';
const COUNTRY = 'NL';

let ws;
let isConnected = false;


const fullscreenButton = document.getElementById('fullscreen-button');
const bannerButton = document.getElementById('banner-button');
const backgroundButton = document.getElementById('background-button');
const resetBackgroundButton = document.getElementById('reset-background-button');

fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    fullscreenButton.textContent = document.fullscreenElement 
    ? 'Verlaat Volledig Scherm' 
    : 'Volledig Scherm';
});

bannerButton.addEventListener('click', () => {
    showBanner(document.getElementById('banner-text').value);
});

const backgroundGif = document.getElementById('background-gif');

backgroundButton.addEventListener('click', () => {
    url = document.getElementById('background-url').value;
    if (url) {
        backgroundGif.src = url;
    }
});

resetBackgroundButton.addEventListener('click', () => {
    backgroundGif.src = "https://github.com/maiky93/maikyy-org/blob/main/media/gifs/winter-2540.gif?raw=true";
});

async function populateImageContainer() {
    const container = document.getElementById('image-scroll-container');
    const owner = 'maiky93';
    const repo = 'maikyy-org';
    const path = 'media/gifs';
    
    try {
        // Fetch repository contents using GitHub API
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
        if (!response.ok) throw new Error('Failed to fetch directory contents');
        
        const files = await response.json();
        console.log(files);
        
        // Filter for image files and create elements
        files.filter(file => file.name.match(/\.(gif|jpg|jpeg|png)$/i))
             .forEach(file => {
                 const img = document.createElement('img');
                 img.src = `${file.download_url}`;  // GitHub raw URL
                 img.alt = file.name;
                 
                 img.addEventListener('click', () => {
                    backgroundGif.src = img.src;
                 });
                 
                 container.appendChild(img);
             });
    } catch (error) {
        console.error('Error loading images:', error);
        container.innerHTML = 'Error loading images';
    }
}


const activityDetails = {
    0: { name: "Openen", color: '#8cc5ff' },
    1: { name: "Afsluiten", color: '#8affb7' },
    2: { name: "Publiek", color: '#666666' },
    3: { name: "Dweilen", color: '#ff5b0d' },
    4: { name: "Beschikbaar", color: '#ffff00' },
    5: { name: "SchaatsSchool", color: '#5f60fe' },
    6: { name: "Curling Optie", color: '#ffff00' },
    7: { name: "IJVL", color: '#15de00' },
    8: { name: "JSC", color: '#78ffe0' },
    9: { name: "V5", color: '#c7ff8d' },
    10: { name: "Leiden Lions", color: '#fea971' },
    11: { name: "Patch ijs", color: '#f7d488' },
    12: { name: "KSVRijnland", color: '#0fe3ff' },
    13: { name: "IHCL", color: '#ff63dd' },
    14: { name: "Ter aar/Leim/Rijnst", color: '#eb663d' },
    15: { name: "Wedstrijden", color: '#00ffff' },
    16: { name: "Gezins Schaatsen", color: '#028000' },
    17: { name: "Oegstgeest", color: '#00ff00' }
};

function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

function formatTimeLeft(endTimeStr) {
    const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    const now = new Date();
    const diffMs = endTime - now;
    if (diffMs <= 0) return "0:00:00";
    
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function fetchSchedule() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/maiky93/maikyy-org/main/data/data.json');
        const data = await response.json();
        return data['Cleaning Schedule'];
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return null;
    }
}

function getCurrentDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
}

function calculateDayProgress() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const totalDayMs = endOfDay - startOfDay;
    const elapsedMs = now - startOfDay;
    
    return (elapsedMs / totalDayMs) * 100;
}

async function updateSchedule() {
    const schedule = await fetchSchedule();
    if (!schedule) return;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const dayName = getCurrentDayName();

    function getTrackActivities(trackName) {
        const daySchedule = schedule[dayName]?.[trackName] || [];
        let currentActivity = null;
        let nextActivity = null;

        for (let i = 0; i < daySchedule.length; i++) {
            const [startTime, endTime, activityType] = daySchedule[i];
            
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            const startTimeInMinutes = startHour * 60 + startMinute;
            const endTimeInMinutes = endHour * 60 + endMinute;

            if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
                currentActivity = {
                    type: activityType,
                    endTime: endTime
                };
                if (i < daySchedule.length - 1) {
                    nextActivity = {
                        type: daySchedule[i + 1][2],
                        startTime: daySchedule[i + 1][0],
                        endTime: daySchedule[i + 1][1]
                    };
                }
                break;
            }
        }
        return { currentActivity, nextActivity };
    }

    function updateTrackDisplay(trackPrefix, activities) {
        const currentElement = document.getElementById(`${trackPrefix}-current-activity`);
        const nextElement = document.getElementById(`${trackPrefix}-next-activity`);

        if (activities.currentActivity) {
            const activity = activityDetails[activities.currentActivity.type] || { name: "Onbekend", color: "#cccccc" };
            const rgbColor = hexToRGB(activity.color);

            const dayProgress = calculateDayProgress();
            
            if (activity.name === "Dweilen") {
                const timeLeft = formatTimeLeft(activities.currentActivity.endTime);
                currentElement.innerHTML = `
                    <div class="progress-bar" style="transform: translateX(-${100 - dayProgress}%)"></div>
                    <span class="activity-block" style="--block-color-rgb: ${rgbColor}">${activity.name}</span> nog ${timeLeft}
                `;
            } else {
                currentElement.innerHTML = `
                    <div class="progress-bar" style="transform: translateX(-${100 - dayProgress}%)"></div>
                    <span class="activity-block" style="--block-color-rgb: ${rgbColor}">${activity.name}</span> tot ${activities.currentActivity.endTime}
                `;
            }
        } else {
            const dayProgress = calculateDayProgress();
            currentElement.innerHTML = `
                <div class="progress-bar" style="transform: translateX(-${100 - dayProgress}%)"></div>
                <span>Geen activiteit</span>
            `;
        }

        if (activities.nextActivity) {
            if (activities.nextActivity.type === 3) {
                const daySchedule = schedule[dayName]?.[trackPrefix === 'hockey' ? 'Hockeybaan' : 'Rondbaan'] || [];
                for (let i = 0; i < daySchedule.length; i++) {
                    const [startTime, endTime, activityType] = daySchedule[i];
                    if (startTime === activities.nextActivity.startTime && activityType === 3) {
                        if (i + 1 < daySchedule.length) {
                            activities.nextActivity = {
                                type: daySchedule[i + 1][2],
                                startTime: daySchedule[i + 1][0],
                                endTime: daySchedule[i + 1][1]
                            };
                        }
                        break;
                    }
                }
            }

            const activity = activityDetails[activities.nextActivity.type] || { name: "Onbekend", color: "#cccccc" };
            const rgbColor = hexToRGB(activity.color);
            nextElement.innerHTML = `<span class="activity-block" style="--block-color-rgb: ${rgbColor}">${activity.name}</span> ${activities.nextActivity.startTime} - ${activities.nextActivity.endTime}`;
        } else {
            nextElement.textContent = "Geen volgende activiteit";
        }
    }

    updateTrackDisplay('hockey', getTrackActivities('Hockeybaan'));
    updateTrackDisplay('rond', getTrackActivities('Rondbaan'));

    const hockeyActivities = getTrackActivities('Hockeybaan');
    const rondActivities = getTrackActivities('Rondbaan');
    const isCleaning = (hockeyActivities.currentActivity?.type === 3 || rondActivities.currentActivity?.type === 3);
    updateScheduleInterval(isCleaning ? {type: 3} : null);
}

const WIND_ARROWS = {
    'N': '↑',
    'NNE': '↗',
    'NE': '↗',
    'ENE': '↗',
    'E': '→',
    'ESE': '↘',
    'SE': '↘',
    'SSE': '↘',
    'S': '↓',
    'SSW': '↙',
    'SW': '↙',
    'WSW': '↙',
    'W': '←',
    'WNW': '↖',
    'NW': '↖',
    'NNW': '↖'
};

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
    return directions[index];
}

async function getWeather() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY},${COUNTRY}&units=metric&lang=nl&appid=${API_KEY}`);
        const data = await response.json();
        
        // Store weather data globally
        window.weatherData = {
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            description: data.weather[0].description,
            iconCode: data.weather[0].icon,
            windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
            windDirection: getWindDirection(data.wind.deg),
            windGust: data.wind.gust ? Math.round(data.wind.gust * 3.6) : null // Convert m/s to km/h
        };

        updateWeatherDisplay();
        
        // Initialize the weather display if it hasn't been done yet
        if (!document.querySelector('.weather-slide')) {
            initWeatherDisplay();
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
        document.getElementById('weather').textContent = '...';
    }
}

function createWeatherElements() {
    const weatherDiv = document.getElementById('weather');
    weatherDiv.innerHTML = ''; // Clear existing content
    
    const slide1 = document.createElement('div');
    slide1.className = 'weather-slide slide-visible';
    slide1.id = 'weather-slide-1';
    
    const slide2 = document.createElement('div');
    slide2.className = 'weather-slide';  // Start without any transition class
    slide2.id = 'weather-slide-2';
    
    weatherDiv.appendChild(slide1);
    weatherDiv.appendChild(slide2);
}

let currentSlide = 1;
let isAnimating = false;

function updateWeatherDisplay() {
    const data = window.weatherData;
    if (!data) return;

    const slide1 = document.getElementById('weather-slide-1');
    const slide2 = document.getElementById('weather-slide-2');
    
    if (!slide1 || !slide2) {
        initWeatherDisplay();
        return;
    }

    const tempDisplay = `
        ${data.temp}°C (voelt als ${data.feelsLike}°C) - ${data.description}
        <img 
            src="https://openweathermap.org/img/wn/${data.iconCode}@2x.png" 
            alt="weather icon" 
            class="weather-icon"
        >
    `;

    const windDisplay = `
        Wind: ${WIND_ARROWS[data.windDirection]} ${data.windSpeed} km/h
        ${data.windGust ? ` (windstoten ${data.windGust} km/h)` : ''}
    `;

    // Set initial content based on current slide
    if (currentSlide === 1) {
        slide1.innerHTML = tempDisplay;
        slide2.innerHTML = windDisplay;
    } else {
        slide1.innerHTML = windDisplay;
        slide2.innerHTML = tempDisplay;
    }
}

function toggleWeatherDisplay() {
    if (isAnimating) return;
    
    const slide1 = document.getElementById('weather-slide-1');
    const slide2 = document.getElementById('weather-slide-2');
    
    if (!slide1 || !slide2) return;

    isAnimating = true;

    // Set up animation end listener
    const onAnimationComplete = () => {
        if (currentSlide === 1) {
            slide1.className = 'weather-slide';
            slide2.className = 'weather-slide slide-visible';
            currentSlide = 2;
        } else {
            slide1.className = 'weather-slide slide-visible';
            slide2.className = 'weather-slide';
            currentSlide = 1;
        }
        isAnimating = false;
    };

    // Add animation classes
    if (currentSlide === 1) {
        slide1.className = 'weather-slide slide-exiting';
        slide2.className = 'weather-slide slide-entering';
    } else {
        slide1.className = 'weather-slide slide-entering';
        slide2.className = 'weather-slide slide-exiting';
    }

    // Wait for animation to complete
    setTimeout(onAnimationComplete, 500); // Match this with CSS transition duration
}

function initWeatherDisplay() {
    createWeatherElements();
    updateWeatherDisplay();
}


function updateDateTime() {
    const now = new Date();
    
    const time = now.toLocaleTimeString('nl-NL', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const dateString = now.toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    document.getElementById('clock').textContent = time;
    document.getElementById('date').textContent = dateString;
}

let scheduleInterval;

function updateScheduleInterval(currentActivity) {
    clearInterval(scheduleInterval);
    const frequency = 1000; // Update every second
    scheduleInterval = setInterval(updateSchedule, frequency);
}

const bannerMessages = [
    "ijshaldevliet.nl voor meer informatie",
    "volg ons op instagram!",
    // Add more messages as needed
];

function getRandomTime() {
    // Random time between 10 and 40 minutes in milliseconds
    return (Math.random() * (20 - 10) + 10) * 60 * 1000;
}

function showBanner(text) {
    const banner = document.getElementById('sliding-banner');
    const bannerText = text || bannerMessages[Math.floor(Math.random() * bannerMessages.length)];
    
    banner.textContent = bannerText;
    banner.classList.add('sliding');

    // Remove the sliding class after animation completes
    banner.addEventListener('animationend', () => {
        banner.classList.remove('sliding');
        scheduleBanner(); // Schedule next banner
    }, { once: true });
}

function scheduleBanner() {
    const nextTime = getRandomTime();
    setTimeout(showBanner, nextTime);
    console.log(`Next banner scheduled in ${Math.round(nextTime/1000/60)} minutes`);
}

function connectWebSocket() {
    if (isConnected) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('Connected to control panel');
        isConnected = true;
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
        console.log('Disconnected from control panel');
        isConnected = false;
        setTimeout(connectWebSocket, 5000);
    };
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'customBanner':
            const banner = document.getElementById('sliding-banner');
            banner.textContent = data.message;
            banner.classList.add('sliding');
            break;
            
        case 'showDefaultBanner':
            showBanner();
            break;
            
        case 'clearBanner':
            const bannerElem = document.getElementById('sliding-banner');
            bannerElem.classList.remove('sliding');
            bannerElem.textContent = '';
            break;
            
        case 'updateSettings':
            if (data.settings.bannerSpeed) {
                document.documentElement.style.setProperty(
                    '--bannerAnimTime', 
                    `${data.settings.bannerSpeed}s`
                );
            }
            
            if (data.settings.background) {
                const backgroundGif = document.getElementById('background-gif');
                switch (data.settings.background) {
                    case 'winter':
                        backgroundGif.src = 'media/gifs/winter-2540.gif';
                        break;
                    case 'summer':
                        backgroundGif.src = 'media/gifs/summer.gif';
                        break;
                    case 'plain':
                        backgroundGif.src = '';
                        break;
                }
            }
            break;
    }
}

function loadSettings() {
    fetch('https://raw.githubusercontent.com/maiky93/maikyy-org/main/data/settings.json')
        .then(response => response.json())
        .then(settings => {
            document.documentElement.style.setProperty('--bannerAnimTime', settings.banner_settings.animation_time);
            bannerMessages = settings.banner_settings.messages;
        })
}

//seconds to ms
const seconds = s => s * 1000;
//minutes to ms
const minutes = m => m * 60 * 1000;
//hours to ms
const hours = h => h * 60 * 60 * 1000;

// Initial calls
//connectWebSocket();
loadSettings();
updateDateTime();
getWeather();         // Keep this to fetch initial data
updateSchedule();
scheduleBanner();
document.addEventListener('DOMContentLoaded', populateImageContainer);

// Set up intervals
setInterval(updateDateTime, seconds(1));
setInterval(getWeather, minutes(30)); // Update weather every 30 minutes
setInterval(toggleWeatherDisplay, seconds(20)); // Toggle weather display every 20 seconds