# SSPL React App

A responsive React application for the Southern Street Premier League (SSPL) - South India's Biggest Tennis Ball Cricket League.

![SSPL Logo](https://via.placeholder.com/150/667eea/FFFFFF?text=SSPL)

## 🏏 About SSPL

The Southern Street Premier League is South India's premier tennis ball cricket tournament that brings together street heroes and transforms them into stadium superstars. With grand finals held in Sharjah and early bird registration at ₹499 + GST, SSPL provides an exciting platform for cricket enthusiasts.

## 🚀 Features

- **Responsive Design**: Fully responsive layout using Bootstrap 5
- **Modern UI**: Clean and attractive design with gradient backgrounds
- **Social Integration**: Links to Instagram, YouTube, Facebook, and Twitter
- **Registration System**: Eye-catching registration promotion with pricing
- **Mobile Optimized**: Perfect viewing experience on all devices
- **Accessibility**: Following web accessibility best practices

## 🛠️ Tech Stack

- **Frontend**: React 18
- **Styling**: Bootstrap 5 + React Bootstrap
- **Icons**: React Icons (FontAwesome)
- **Build Tool**: Create React App
- **Package Manager**: npm

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sspl-react-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Header.js          # Navigation header
│   ├── Hero.js            # Main hero section with logo
│   ├── Registration.js    # Registration cards section
│   ├── SocialMedia.js     # Social media follow section
│   └── Footer.js          # Footer with links
├── styles/
│   └── App.css           # Custom styles and animations
├── assets/               # Images and static assets
├── App.js               # Main app component
└── index.js             # Entry point
```

## 🎨 Components

### Header
- Responsive navigation with SSPL branding
- Mobile-friendly hamburger menu
- Sticky navigation for better UX

### Hero Section
- SSPL logo and main title
- Social media icon buttons
- Gradient background matching brand colors

### Registration Section
- Two-card layout: Grand Finals info and Sign Up
- Eye-catching pricing display (₹499 + GST)
- Registration status indicator

### Social Media Section
- Instagram and Facebook follow buttons
- Clean card-based layout

### Footer
- SSPL information and tagline
- Social media links
- Copyright information

## 🎯 Key Features Implemented

1. **From the Design**: 
   - Blue gradient backgrounds matching the original design
   - SSPL branding and logo placement
   - Registration promotion with pricing
   - Social media integration
   - Grand Finals in Sharjah promotion

2. **Responsive Design**:
   - Mobile-first approach
   - Bootstrap grid system
   - Responsive typography
   - Optimized for all screen sizes

3. **Interactive Elements**:
   - Hover animations on buttons and cards
   - Smooth transitions
   - Social media links

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 992px  
- **Desktop**: > 992px

## 🚀 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## 🎨 Customization

### Colors
The app uses a custom color scheme:
- Primary Blue: `#667eea`
- Secondary Purple: `#764ba2`
- Warning Yellow: `#FFE066`
- Success Green: Bootstrap default

### Fonts
- Default: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto')
- Fallback: 'Helvetica Neue', sans-serif

## 🔧 Configuration

### Environment Variables
Create a `.env` file for custom configuration:
```
PORT=3001
REACT_APP_API_URL=your-api-url
```

### Social Media Links
Update social media links in `Footer.js` and `Hero.js` components.

## 🌐 Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect your Git repository
- **GitHub Pages**: Use `gh-pages` package
- **Firebase Hosting**: Use Firebase CLI

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- 📧 Email: support@sspl.com
- 📱 Instagram: @sspl
- 📘 Facebook: /sspl

## 🏆 SSPL Tournament Info

- **Tournament**: Southern Street Premier League
- **Location**: South India
- **Grand Finals**: Sharjah Stadium
- **Registration**: ₹499 + GST (Early Bird)
- **Status**: Registrations Open

---

**Built with ❤️ for cricket enthusiasts across South India**