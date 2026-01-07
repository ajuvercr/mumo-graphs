# Mumo Graphs

A web-based dashboard for visualizing real-time sensor data from Linked Data Event Streams (LDES). Built with SvelteKit, this application provides interactive charts and graphs for IoT sensor monitoring and analysis.

## Features

- **Real-time Data Visualization**: Live streaming and visualization of sensor data from LDES endpoints
- **Interactive Charts**: Powered by Chart.js with zoom, pan, and export capabilities
- **Multi-Platform Support**: Monitor sensors across different locations and platforms
- **Configurable Constraints**: Filter data by time ranges, sensor types, locations, and nodes
- **Solid Authentication**: Secure authentication using Solid POD and OIDC
- **Responsive Design**: Modern UI built with TailwindCSS and Flowbite Svelte components
- **Persistent Configuration**: Save and restore graph configurations per user profile

## Architecture

The application consumes data from two main LDES sources:
- **Sensor LDES**: Metadata about sensors, platforms, and their locations
- **Data LDES**: Time-series measurement data from the sensors

### Key Components

- **LdesGraph**: Main component for rendering interactive data visualizations
- **Platform Discovery**: Automatic discovery of sensors and platforms from RDF shapes
- **Constraint Engine**: Flexible filtering system for data queries
- **Authentication**: Solid POD integration for user management

## Technology Stack

- **Frontend**: SvelteKit 4.x with TypeScript
- **Styling**: TailwindCSS + Flowbite Svelte components
- **Charts**: Chart.js with svelte-chartjs integration
- **Data Processing**: RDF/Linked Data with n3.js and ldes-client
- **Authentication**: Solid client libraries
- **Build**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/mumo-full/graphs.git
cd mumo-graphs

# Install dependencies
npm install
```

### Development

Start the development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

The application will be available at `http://localhost:5173`

### Configuration

Before running, you may need to configure the LDES endpoints:

1. Navigate to the Settings page
2. Configure your Sensor LDES and Data LDES URLs
3. Settings are automatically saved to localStorage

### Building

Create a production version of the app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage

1. **Login**: Authenticate using your Solid POD credentials
2. **Discover Sensors**: The app automatically discovers available sensors and platforms
3. **Create Graphs**: Click "New Graph" to create visualizations
4. **Configure Constraints**: Set filters for time ranges, sensor types, locations
5. **Monitor Data**: View real-time updates and interact with charts
6. **Export Data**: Export chart data for further analysis

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components
│   ├── configs/        # RDF shapes and configurations
│   ├── constraints.ts  # Data filtering logic
│   ├── paths.ts        # Data path definitions
│   ├── settings.ts     # Application settings
│   └── utils.ts        # Utility functions
├── routes/
│   ├── +layout.svelte  # Main app layout
│   ├── +page.svelte    # Dashboard page
│   └── settings/       # Settings page
└── app.html            # HTML template
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting:
   ```bash
   npm run lint
   npm run check
   ```
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

This is part of the Mumo (Multi-Modal Monitoring) ecosystem for IoT data management and visualization.
