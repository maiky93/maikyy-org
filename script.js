const API_KEY = 'f0436ea441ee727e737ca8ad122414f4';
const CITY = 'Leiden';
const COUNTRY = 'NL';

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

async function getWeather() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY},${COUNTRY}&units=metric&lang=nl&appid=${API_KEY}`);
        const data = await response.json();
        
        const temp = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const description = data.weather[0].description;
        
        document.getElementById('weather').textContent = 
            `${temp}°C (voelt als ${feelsLike}°C) - ${description}`;
    } catch (error) {
        console.error('Error fetching weather:', error);
        document.getElementById('weather').textContent = '...';
    }
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
    return (Math.random() * (40 - 10) + 10) * 60 * 1000;
}

function showBanner() {
    const banner = document.getElementById('sliding-banner');
    const randomMessage = bannerMessages[Math.floor(Math.random() * bannerMessages.length)];
    
    banner.textContent = randomMessage;
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

function loadSettings() {
    fetch('https://raw.githubusercontent.com/maiky93/maikyy-org/main/data/settings.json')
        .then(response => response.json())
        .then(settings => {
            document.documentElement.style.setProperty('--bannerAnimTime', settings.banner_settings.animation_time);
            bannerMessages = settings.banner_settings.messages;
        })
}

// Initial calls
loadSettings();
updateDateTime();
getWeather();
updateSchedule();
scheduleBanner();

// Set up intervals
setInterval(updateDateTime, 1000);
setInterval(getWeather, 1800000); // Update weather every 30 minutes