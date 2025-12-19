# DoneSwipe ✓

<div align="center">

**Swipe to Done. Experience the most satisfying task manager.**

A gamified task management app built with React and Firebase, featuring beautiful animations, psychological design principles, and a rewarding completion experience.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![React](https://img.shields.io/badge/React-19.2-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.7-orange)

</div>

---

## ✨ Features

- 🎮 **Gamification System** - XP, Levels, and Streak tracking to keep you motivated
- 🎨 **Beautiful Animations** - Confetti celebrations, smooth transitions, and micro-interactions
- 📱 **Mobile-First Design** - Optimized for touch gestures with Fitts' Law principles
- 🌍 **Multi-Language** - English and Turkish support
- 🔥 **Streak System** - Build daily habits with streak tracking
- 💫 **Variable Rewards** - Random celebration messages for dopamine-driven motivation
- 📴 **PWA Support** - Install as a native app on any device

## 🧠 Design Principles

DoneSwipe is built on psychological design principles:

1. **Cognitive Load Theory** - Focus Mode hides distractions when engaging with tasks
2. **Zeigarnik Effect** - Visible progress and satisfying completion rituals
3. **Variable Rewards** - Random celebration messages and confetti patterns
4. **Fitts' Law** - Touch targets sized for thumb zone comfort

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/DoneSwipe.git
cd DoneSwipe
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server
```bash
npm run dev
```

## 📦 Tech Stack

- **Frontend**: React 19, Framer Motion
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Auth, Firestore)
- **Build Tool**: Vite 7
- **PWA**: vite-plugin-pwa
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Confetti**: Canvas Confetti

## 🎯 Usage

- **Double Tap** - Complete a task
- **Long Press** - Edit a task
- **Scroll** - Navigate between tasks
- **+ Button** - Add new task

## 📱 Screenshots

The app features a beautiful dark theme with glassmorphism effects, animated task cards with priority-based gradients, and satisfying completion celebrations.

## 🛠 Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

<div align="center">
Made with 💜 for productivity
</div>
