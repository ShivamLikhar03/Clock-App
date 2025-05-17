# Clock App

A modern clock application built with HTML, CSS, and JavaScript, with a Flask backend.

## Features

- Digital and analog clock with colorful ring design
- Alarm functionality with notification support
- World clock for viewing multiple time zones
- Stopwatch with lap timing
- Timer with visual and audio notifications

## Setup Instructions

1. Clone this repository
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   python app.py
   ```
4. Open your browser and navigate to `http://localhost:5000`

## Technologies Used

- Flask for the backend server
- HTML5, CSS3, and JavaScript for the frontend
- LocalStorage for saving alarms and timezones
- Web Notifications API

## Customization

The clock design features colorful rings that can be customized by modifying the CSS variables in the `style.css` file:

- The hour ring is colored pink/magenta (`#ff4081`)
- The minute ring is colored yellow (`#ffeb3b`)
- The second ring is colored green (`#4caf50`)

You can easily change these colors to suit your preferences. 