# RTRMM Moliya - Frontend

Raqamli Ta'limni Rivojlantirish Markazi Moliya bo'limi uchun yaratilgan document management system.

## 🚀 Vercel Deployment

### Prerequisites
1. [Vercel account](https://vercel.com) yarating
2. GitHub repository ni Vercel ga ulang

### Deployment Steps

1. **Vercel CLI ni o'rnating** (ixtiyoriy):
```bash
npm i -g vercel
```

2. **GitHub orqali deploy qilish** (tavsiya etiladi):
   - Vercel dashboard ga kiring
   - "New Project" tugmasini bosing
   - GitHub repository ni tanlang
   - Framework preset: **React**
   - Root Directory: `frontend`

3. **Environment Variables** (Vercel dashboard da sozlang):
```
REACT_APP_API_URL=https://your-backend-api.herokuapp.com/api
REACT_APP_NAME=RTRMM Moliya
REACT_APP_VERSION=1.0.0
```

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### Automatic Deployments
- Main branch ga har push qilganingizda avtomatik deploy bo'ladi
- Pull request lar uchun preview URL yaratiladi

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Test build locally
npm install -g serve
serve -s build
```

## 📁 Project Structure

```
src/
├── components/     # React components
├── pages/         # Page components
├── services/      # API services
├── store/         # Redux store
├── hooks/         # Custom hooks
├── types/         # TypeScript types
└── config/        # Configuration files

public/
├── favicon/       # Favicon files
├── logo/         # Logo files
└── manifest.json # PWA manifest
```

## 🔧 Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_NAME`: Application name
- `REACT_APP_VERSION`: Application version

### Vercel Configuration
- `vercel.json`: Vercel deployment settings
- `.vercelignore`: Files to ignore during deployment

## 🎨 Features

- ✅ JWT Authentication
- ✅ File Management
- ✅ Excel/OnlyOffice Integration
- ✅ OneDrive Embed Viewer
- ✅ Department Management
- ✅ User Management
- ✅ Responsive Design
- ✅ PWA Support

## 📞 Support

Muammolar uchun GitHub Issues bo'limidan foydalaning.