// mmdc.puppeteer.config.cjs
// Mermaid CLI (mmdc) Puppeteer configuration file
// This configuration is specifically optimized for Mermaid diagram rendering via the Mermaid CLI tool.
// The Mermaid CLI uses Puppeteer to render diagrams from .mmd files to various formats (PNG, PDF, SVG).
// These settings ensure high-quality diagram output with proper font rendering and cross-platform compatibility.

module.exports = {
  // Puppeteer launch configuration - controls the Chrome/Chromium browser instance used by mmdc
  launch: {
    // Use the new headless mode for diagram rendering - provides better compatibility
    // with Mermaid's rendering engine compared to legacy headless mode. Essential for
    // consistent diagram generation across different environments and output formats.
    headless: "new",

    // Chrome command-line arguments optimized for diagram rendering performance and quality
    args: [
      // Critical for diagram text clarity - optimizes font rendering for sharp, readable text
      // in diagram nodes, labels, and flowcharts. 'medium' provides the best balance between
      // rendering quality and processing speed for technical diagrams.
      "--font-render-hinting=medium",
      // Ensure high-DPI rendering for Retina displays
      "--force-device-scale-factor=2",
      "--enable-font-antialiasing",

      // Disable Chrome's sandbox for better compatibility in containerized environments
      // (Docker, CI/CD) and certain server configurations. Required for mmdc to function
      // properly in many deployment scenarios, though it reduces security isolation.
      "--no-sandbox",

      // Companion flag to --no-sandbox - disables setuid sandbox functionality
      // Often required together for complete sandbox disabling in restrictive environments.
      "--disable-setuid-sandbox",

      // Intentionally NOT using "--disable-gpu" to leverage Apple Silicon GPU acceleration
      // on macOS devices. This significantly improves rendering performance for complex
      // diagrams with many elements, gradients, or when batch-processing multiple diagrams.
      // Critical for maintaining performance on M1/M2/M3 Mac systems.
    ],
  },

  // Default viewport configuration - defines the rendering canvas dimensions for mmdc
  defaultViewport: {
    // Standard width optimized for most Mermaid diagrams - provides sufficient space
    // for typical flowcharts, sequence diagrams, and Gantt charts without excessive whitespace.
    // This dimension works well for documentation, presentations, and web integration.
    width: 1280,

    // Height dimension that accommodates most diagram types while allowing vertical expansion
    // for complex diagrams. Provides a good balance between detail visibility and file size.
    height: 720,

    // Retina display optimization (deviceScaleFactor: 2) is crucial for mmdc output quality
    // - PNG/SVG exports will be rendered at 2x resolution, resulting in crisp, professional
    //   diagrams on high-DPI displays and when printed. This is especially important for
    //   technical documentation and presentation materials where text sharpness matters.
    deviceScaleFactor: 2, // Retina/high-DPI optimization for sharp diagram text and lines
  },

  // Font family configuration - defines typography for Mermaid diagram text rendering
  // These font stacks ensure consistent, readable text across different platforms and
  // output formats. Proper font rendering is critical for diagram legibility, especially
  // in technical documentation and system architecture diagrams.
  fontFamilies: {
    // Sans-serif font stack for diagram text - optimized for readability in nodes and labels
    // Prioritizes system fonts for performance, with comprehensive cross-platform fallbacks.
    // The order ensures the best available font is used for each operating system.
    sans: [
      "SF Pro Text",        // Apple's system UI font - optimal rendering on macOS/iOS
      "Helvetica Neue",     // Professional sans-serif available on most systems
      "Helvetica",          // Classic Helvetica fallback for broad compatibility
      "Arial",              // Ubiquitous web-safe font for maximum compatibility
      "PingFang SC",        // Essential Chinese font for Simplified Chinese diagram text
      "Microsoft YaHei",    // Windows Chinese font for cross-platform Chinese support
      "Noto Sans CJK SC",   // Google's comprehensive Unicode font for CJK languages
      "sans-serif",         // Ultimate fallback to system default sans-serif font
    ],

    // Serif fonts for formal diagram styling - used in specific diagram themes
    // or when a more traditional appearance is desired for documentation diagrams.
    serif: [
      "Times New Roman",    // Classic serif font with excellent cross-platform availability
      "serif",              // System default serif font as final fallback
    ],

    // Monospace fonts critical for code blocks in diagrams and technical documentation
    // Mermaid diagrams often include code snippets, database schemas, or technical notation
    // that require fixed-width fonts for proper alignment and readability.
    mono: [
      "SF Mono",            // Apple's premium monospace font - exceptional on macOS
      "Menlo",              // macOS system monospace font with excellent character distinction
      "Monaco",             // Classic macOS developer font with wide character support
      "Courier New",        // Cross-platform monospace standard for broad compatibility
      "monospace",          // System default monospace font as final fallback
    ],
  },
};