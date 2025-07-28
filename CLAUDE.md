# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based automation crawler application that combines a React/TypeScript frontend with a Python Selenium backend. The application performs web scraping tasks for Korean government procurement systems and educational platforms.

## Architecture

### Frontend (Electron + React)

- **Location**: `frontend/`
- **Stack**: Electron, React, TypeScript, Vite, TailwindCSS
- **Main Process**: `electron/main.ts` - handles IPC communications with Python backend
- **Renderer**: React SPA with routing for different crawler services
- **IPC Layer**: `electron/ipcs/` - handles communication between frontend and Python processes

### Backend (Python)

- **Location**: `backend/`
- **Stack**: Python, Selenium, PyInstaller
- **Entry Point**: `src/main.py` - CLI interface for crawling operations
- **Services**: `src/services/` - specific crawler implementations
- **Classes**: `src/classes/` - Excel and Selenium wrapper classes

### Build Process

The application uses a two-stage build:

1. Python backend is compiled to executable using PyInstaller
2. Electron frontend is built with the Python executable bundled as a resource

## Development Commands

### Frontend Development

```bash
cd frontend
npm run dev          # Start Vite dev server with Electron
npm run build        # Build TypeScript, Vite, and Electron app
npm run lint         # Run ESLint
```

### Backend Development

```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Build Python executable
pyinstaller \
  --onefile \
  --name script \
  --distpath ../frontend/resources \
  src/main.py

# Test backend directly
python src/main.py --type open-go-kr --downloadDir ./test --excelName test.xlsx --data '[{"query":"전자칠판","organization":"서울서일초등학교","location":"서울특별시교육청","startDate":"2025-02-19","endDate":"2025-05-22"}]' --debug true
```

## Key Components

### IPC Communication

- **Python IPC**: `frontend/electron/ipcs/pythonIpc.ts` - spawns Python processes and handles stdio
- **Download IPC**: `frontend/electron/ipcs/downloadDirIpc.ts` - manages download directory
- **Excel IPC**: `frontend/electron/ipcs/downloadQueryExcel.ts` - handles Excel file operations

### React Features Architecture

- **Feature-based structure**: `frontend/src/features/` contains self-contained feature modules
- **Pages**: `frontend/src/pages/` - top-level page components
- **Shared components**: `frontend/src/components/ui/` - reusable UI components

### Python Services

- **OpenGoKr**: `backend/src/services/openGoKr.py` - Korean government procurement crawler
- **Excel handling**: `backend/src/classes/Excel.py` - Excel file operations
- **Selenium wrapper**: `backend/src/classes/Selenium.py` - browser automation

## Build Distribution

### Complete Build Process

```bash
# 1. Build Python backend
cd backend
pyinstaller --onefile --name script --distpath ../frontend/resources src/main.py

# 2. Build Electron app
cd ../frontend
npm run build

# 3. Distribution files will be in frontend/dist/
```

### Testing Built Application

The Python executable can be tested independently:

```bash
./frontend/resources/script --type open-go-kr --downloadDir ./test --excelName test.xlsx --data '[...]' --debug true
```

## Important Notes

- The application requires the Python executable to be built before the Electron build
- Excel files are bundled in `frontend/excel/` and copied to resources during build
- The app supports scheduled execution through the frontend interface
- All crawler data is output to Excel files in the specified download directory
- The application uses UTF-8 encoding for proper Korean text handling

## Communication Guidelines

- **Language Preference**:
  - 앞으로 한국어로 대답해줘.