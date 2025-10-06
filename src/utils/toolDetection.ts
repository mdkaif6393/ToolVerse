import JSZip from 'jszip';

export interface DetectedTool {
  name: string;
  path: string;
  confidence: number;
  language: string;
  framework?: string;
  techStack: string[];
  entryPoint?: string;
  hasTests: boolean;
  hasConfig: boolean;
  hasDocumentation: boolean;
  dependencies: string[];
  category: string;
  description: string;
  files: string[];
}

export interface ProjectStructure {
  type: 'single-tool' | 'multi-tool' | 'monorepo' | 'library';
  totalFiles: number;
  toolDirectories: number;
  sharedDependencies: string[];
  buildSystems: string[];
  hasWorkspace: boolean;
}

export interface MultiToolAnalysis {
  projectStructure: ProjectStructure;
  detectedTools: DetectedTool[];
  totalTools: number;
  recommendations: string[];
}

// Language detection from file extensions
const LANGUAGE_EXTENSIONS = {
  'JavaScript': ['.js', '.mjs', '.cjs'],
  'TypeScript': ['.ts', '.tsx'],
  'React': ['.jsx', '.tsx'],
  'Python': ['.py', '.pyx', '.pyi'],
  'Go': ['.go'],
  'Rust': ['.rs'],
  'Java': ['.java'],
  'Kotlin': ['.kt', '.kts'],
  'C++': ['.cpp', '.cc', '.cxx', '.c++'],
  'C': ['.c', '.h'],
  'C#': ['.cs'],
  'PHP': ['.php'],
  'Ruby': ['.rb'],
  'Swift': ['.swift'],
  'Scala': ['.scala'],
  'Dart': ['.dart'],
  'HTML': ['.html', '.htm'],
  'CSS': ['.css', '.scss', '.sass', '.less'],
  'Vue': ['.vue'],
  'Svelte': ['.svelte']
};

// Framework detection patterns
const FRAMEWORK_PATTERNS = {
  'React': ['react', 'jsx', 'tsx', 'create-react-app', 'next.js'],
  'Vue.js': ['vue', 'nuxt', 'quasar'],
  'Angular': ['angular', '@angular', 'ng-'],
  'Next.js': ['next', 'next.config', '_app.', '_document.'],
  'Nuxt.js': ['nuxt', 'nuxt.config'],
  'Svelte': ['svelte', 'sveltekit'],
  'Django': ['django', 'manage.py', 'settings.py'],
  'Flask': ['flask', 'app.py', 'wsgi.py'],
  'FastAPI': ['fastapi', 'main.py', 'uvicorn'],
  'Express.js': ['express', 'app.js', 'server.js'],
  'Spring Boot': ['spring-boot', 'application.properties', '@SpringBootApplication'],
  'Laravel': ['laravel', 'artisan', 'composer.json'],
  'Rails': ['rails', 'Gemfile', 'config/application.rb'],
  'Electron': ['electron', 'main.js', 'preload.js']
};

// Build system detection
const BUILD_SYSTEMS = {
  'Webpack': ['webpack.config.js', 'webpack.config.ts'],
  'Vite': ['vite.config.js', 'vite.config.ts'],
  'Rollup': ['rollup.config.js', 'rollup.config.ts'],
  'Parcel': ['.parcelrc', 'parcel.config.js'],
  'Gulp': ['gulpfile.js', 'gulpfile.ts'],
  'Grunt': ['Gruntfile.js', 'gruntfile.js'],
  'Maven': ['pom.xml'],
  'Gradle': ['build.gradle', 'build.gradle.kts'],
  'Make': ['Makefile', 'makefile'],
  'CMake': ['CMakeLists.txt'],
  'Cargo': ['Cargo.toml'],
  'Go Modules': ['go.mod'],
  'npm': ['package.json'],
  'Yarn': ['yarn.lock'],
  'pnpm': ['pnpm-lock.yaml']
};

// Entry point patterns
const ENTRY_POINTS = [
  'index.js', 'index.ts', 'index.jsx', 'index.tsx',
  'main.js', 'main.ts', 'main.py',
  'app.js', 'app.ts', 'app.py',
  'server.js', 'server.ts',
  'index.html', 'main.html',
  'App.jsx', 'App.tsx', 'App.vue',
  'main.go', 'main.rs'
];

// Tool directory indicators
const TOOL_INDICATORS = [
  'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod',
  'pom.xml', 'build.gradle', 'composer.json', 'Gemfile',
  'setup.py', 'pyproject.toml', 'main.py', 'app.py',
  'index.js', 'index.ts', 'main.js', 'main.ts',
  'README.md', 'readme.md', 'README.txt'
];

export class ToolDetectionEngine {
  
  /**
   * Analyze ZIP file for multiple tools
   */
  static async analyzeZipFile(zipFile: File): Promise<MultiToolAnalysis> {
    console.log('Starting ZIP analysis for:', zipFile.name);
    const zip = await JSZip.loadAsync(zipFile);
    const files = Object.keys(zip.files).filter(path => !zip.files[path].dir);
    
    console.log('Total files found:', files.length);
    console.log('Files:', files);
    
    // Analyze project structure
    const projectStructure = this.analyzeProjectStructure(files);
    console.log('Project structure:', projectStructure);
    
    // Detect individual tools
    const detectedTools = await this.detectToolsInFiles(zip, files);
    console.log('Detected tools:', detectedTools);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(projectStructure, detectedTools);
    
    return {
      projectStructure,
      detectedTools,
      totalTools: detectedTools.length,
      recommendations
    };
  }

  /**
   * Analyze project structure type
   */
  private static analyzeProjectStructure(files: string[]): ProjectStructure {
    const directories = new Set<string>();
    const rootFiles = files.filter(f => !f.includes('/'));
    
    // Extract directories
    files.forEach(file => {
      const parts = file.split('/');
      if (parts.length > 1) {
        directories.add(parts[0]);
      }
    });

    // Check for workspace indicators
    const hasWorkspace = files.some(f => 
      f.includes('workspace') || 
      f.includes('lerna.json') || 
      f.includes('nx.json') ||
      f.includes('rush.json')
    );

    // Count potential tool directories
    const toolDirectories = Array.from(directories).filter(dir => {
      const dirFiles = files.filter(f => f.startsWith(dir + '/'));
      return dirFiles.some(f => TOOL_INDICATORS.some(indicator => f.includes(indicator)));
    }).length;

    // Check if root level has tool indicators (mixed scenario)
    const hasRootTool = rootFiles.some(f => TOOL_INDICATORS.some(indicator => f.includes(indicator)));

    // Determine project type with enhanced logic for mixed scenarios
    let type: ProjectStructure['type'] = 'single-tool';
    
    if (toolDirectories >= 3 || hasWorkspace) {
      type = 'monorepo';
    } else if (toolDirectories >= 2 || (toolDirectories >= 1 && hasRootTool)) {
      // Mixed scenario: directories + root files, or multiple directories
      type = 'multi-tool';
    } else if (toolDirectories === 1 && !hasRootTool) {
      // Single directory tool
      type = 'single-tool';
    } else if (hasRootTool && toolDirectories === 0) {
      // Only root level files
      type = 'single-tool';
    } else if (rootFiles.some(f => f.includes('lib') || f.includes('component'))) {
      type = 'library';
    }

    // Detect shared dependencies
    const sharedDependencies = this.detectSharedDependencies(files);
    
    // Detect build systems
    const buildSystems = this.detectBuildSystems(files);

    return {
      type,
      totalFiles: files.length,
      toolDirectories: toolDirectories + (hasRootTool ? 1 : 0), // Include root as tool if applicable
      sharedDependencies,
      buildSystems,
      hasWorkspace
    };
  }

  /**
   * Detect individual tools in the project
   */
  private static async detectToolsInFiles(zip: JSZip, files: string[]): Promise<DetectedTool[]> {
    const tools: DetectedTool[] = [];
    const directories = new Set<string>();
    
    // Group files by directory
    const filesByDir = new Map<string, string[]>();
    const rootFiles: string[] = [];
    
    files.forEach(file => {
      const parts = file.split('/');
      if (parts.length === 1) {
        // Root level file
        rootFiles.push(file);
        console.log(`Root file: ${file}`);
      } else {
        // File in subdirectory
        const dir = parts[0];
        directories.add(dir);
        
        if (!filesByDir.has(dir)) {
          filesByDir.set(dir, []);
        }
        filesByDir.get(dir)!.push(file);
        console.log(`Directory file: ${file} -> ${dir}`);
      }
    });

    console.log(`Root files (${rootFiles.length}):`, rootFiles);
    console.log(`Directories (${directories.size}):`, Array.from(directories));
    console.log('Files by directory:', Object.fromEntries(filesByDir));

    // First, analyze subdirectories as potential tools
    const directoryTools: DetectedTool[] = [];
    for (const [dir, dirFiles] of filesByDir.entries()) {
      console.log(`Analyzing directory: ${dir} with ${dirFiles.length} files:`, dirFiles);
      const toolAnalysis = await this.analyzeDirectoryAsTool(zip, dir, dirFiles);
      console.log(`Tool analysis for ${dir}:`, toolAnalysis);
      
      // Lower threshold for better detection
      if (toolAnalysis && toolAnalysis.confidence > 0.2) {
        directoryTools.push(toolAnalysis);
        tools.push(toolAnalysis);
      }
    }

    // Then, analyze root files as potential additional tools
    if (rootFiles.length > 0) {
      const rootToolAnalysis = await this.analyzeRootFiles(zip, rootFiles, directoryTools.length > 0);
      if (rootToolAnalysis) {
        tools.push(rootToolAnalysis);
      }
    }

    // If no tools found anywhere, analyze entire project as single tool
    if (tools.length === 0) {
      console.log('No tools detected, analyzing entire project as single tool');
      const singleToolAnalysis = await this.analyzeDirectoryAsTool(zip, 'root', files);
      if (singleToolAnalysis) {
        tools.push(singleToolAnalysis);
      }
    }

    // Fallback: if still no tools, create a basic tool from all files
    if (tools.length === 0) {
      console.log('Creating fallback tool from all files');
      const fallbackTool: DetectedTool = {
        name: 'Uploaded Project',
        path: '.',
        confidence: 0.3,
        language: this.detectLanguage(files),
        techStack: this.detectTechStack(files),
        entryPoint: this.findEntryPoint(files),
        hasTests: files.some(f => f.includes('test') || f.includes('spec')),
        hasConfig: files.some(f => f.includes('config') || f.includes('.env')),
        hasDocumentation: files.some(f => f.toLowerCase().includes('readme')),
        dependencies: [],
        category: 'productivity',
        description: 'A tool created from uploaded files',
        files: files.map(f => f.split('/').pop() || f)
      };
      tools.push(fallbackTool);
    }

    return tools.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze root-level files as potential tool
   */
  private static async analyzeRootFiles(
    zip: JSZip, 
    rootFiles: string[], 
    hasDirectoryTools: boolean
  ): Promise<DetectedTool | null> {
    if (rootFiles.length === 0) return null;

    // Check if root files form a coherent tool
    const hasPackageJson = rootFiles.some(f => f === 'package.json');
    const hasRequirements = rootFiles.some(f => f === 'requirements.txt');
    const hasCargoToml = rootFiles.some(f => f === 'Cargo.toml');
    const hasGoMod = rootFiles.some(f => f === 'go.mod');
    const hasMainFile = rootFiles.some(f => ENTRY_POINTS.includes(f));
    const hasReadme = rootFiles.some(f => f.toLowerCase().includes('readme'));

    // Calculate confidence for root-level tool
    let confidence = 0.2; // Lower base confidence since it's mixed with directories

    if (hasPackageJson || hasRequirements || hasCargoToml || hasGoMod) confidence += 0.3;
    if (hasMainFile) confidence += 0.2;
    if (hasReadme) confidence += 0.1;
    if (hasDirectoryTools) confidence -= 0.1; // Reduce confidence if there are also directory tools

    console.log(`Root files confidence: ${confidence}`);
    
    // Lower threshold for root files too
    if (confidence < 0.2) return null;

    // Detect language and tech stack
    const language = this.detectLanguage(rootFiles);
    const framework = await this.detectFramework(zip, rootFiles);
    const techStack = this.detectTechStack(rootFiles);
    const entryPoint = this.findEntryPoint(rootFiles);

    // Check for tests, config, documentation
    const hasTests = rootFiles.some(f => 
      f.includes('test') || f.includes('spec') || f.includes('__tests__')
    );
    const hasConfig = rootFiles.some(f => 
      f.includes('config') || f.includes('.env') || f.includes('settings')
    );
    const hasDocumentation = rootFiles.some(f => 
      f.includes('doc') || f.includes('README') || f.includes('.md')
    );

    // Extract dependencies
    const dependencies = await this.extractDependencies(zip, rootFiles);

    // Generate tool name
    let name = 'Root Project';
    if (hasPackageJson) {
      try {
        const packageContent = await zip.files['package.json'].async('string');
        const packageJson = JSON.parse(packageContent);
        if (packageJson.name) {
          name = packageJson.name.charAt(0).toUpperCase() + packageJson.name.slice(1).replace(/[-_]/g, ' ');
        }
      } catch (error) {
        // Ignore parsing errors
      }
    } else if (entryPoint) {
      const baseName = entryPoint.replace(/\.[^/.]+$/, '');
      name = baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/[-_]/g, ' ');
    }

    // Add suffix to distinguish from directory tools
    if (hasDirectoryTools) {
      name += ' (Main)';
    }

    const category = this.determineCategory(name, techStack, rootFiles);
    const description = this.generateDescription(name, language, framework, techStack);

    return {
      name,
      path: '.',
      confidence: Math.min(confidence, 1.0),
      language,
      framework,
      techStack,
      entryPoint,
      hasTests,
      hasConfig,
      hasDocumentation,
      dependencies,
      category,
      description,
      files: rootFiles
    };
  }

  /**
   * Analyze a directory as a potential tool with enhanced detection
   */
  private static async analyzeDirectoryAsTool(
    zip: JSZip, 
    dirName: string, 
    files: string[]
  ): Promise<DetectedTool | null> {
    if (files.length === 0) return null;

    // Enhanced confidence calculation with multiple factors
    let confidence = 0.0;
    const indicators = {
      hasPackageJson: files.some(f => f.endsWith('package.json')),
      hasRequirements: files.some(f => f.endsWith('requirements.txt')),
      hasCargoToml: files.some(f => f.endsWith('Cargo.toml')),
      hasGoMod: files.some(f => f.endsWith('go.mod')),
      hasPomXml: files.some(f => f.endsWith('pom.xml')),
      hasGradleBuild: files.some(f => f.includes('build.gradle')),
      hasComposerJson: files.some(f => f.endsWith('composer.json')),
      hasGemfile: files.some(f => f.endsWith('Gemfile')),
      hasSetupPy: files.some(f => f.endsWith('setup.py')),
      hasPyprojectToml: files.some(f => f.endsWith('pyproject.toml')),
      hasEntryPoint: files.some(f => ENTRY_POINTS.some(ep => f.endsWith(ep))),
      hasReadme: files.some(f => f.toLowerCase().includes('readme')),
      hasLicense: files.some(f => f.toLowerCase().includes('license')),
      hasGitignore: files.some(f => f.endsWith('.gitignore')),
      hasDockerfile: files.some(f => f.toLowerCase().includes('dockerfile')),
      hasConfigFiles: files.some(f => 
        f.includes('config') || f.includes('.env') || f.includes('settings') ||
        f.includes('webpack') || f.includes('vite') || f.includes('rollup') ||
        f.includes('babel') || f.includes('eslint') || f.includes('prettier')
      ),
      hasCodeFiles: files.some(f => {
        const ext = '.' + f.split('.').pop()?.toLowerCase();
        return Object.values(LANGUAGE_EXTENSIONS).flat().includes(ext);
      }),
      hasTestFiles: files.some(f => 
        f.includes('test') || f.includes('spec') || f.includes('__tests__') ||
        f.includes('.test.') || f.includes('.spec.')
      ),
      hasSourceDir: files.some(f => 
        f.includes('/src/') || f.includes('/lib/') || f.includes('/source/')
      ),
      hasPublicAssets: files.some(f => 
        f.includes('/public/') || f.includes('/assets/') || f.includes('/static/')
      ),
      hasNodeModules: files.some(f => f.includes('node_modules')),
      hasVendor: files.some(f => f.includes('vendor/') || f.includes('third_party/')),
      hasBuildOutput: files.some(f => 
        f.includes('/dist/') || f.includes('/build/') || f.includes('/target/') ||
        f.includes('/bin/') || f.includes('/out/')
      )
    };

    console.log(`Enhanced analysis for ${dirName}:`, indicators);

    // Primary indicators (strong evidence of a tool)
    if (indicators.hasPackageJson) confidence += 0.5;
    if (indicators.hasRequirements) confidence += 0.5;
    if (indicators.hasCargoToml) confidence += 0.5;
    if (indicators.hasGoMod) confidence += 0.5;
    if (indicators.hasPomXml) confidence += 0.5;
    if (indicators.hasGradleBuild) confidence += 0.5;
    if (indicators.hasComposerJson) confidence += 0.5;
    if (indicators.hasGemfile) confidence += 0.5;
    if (indicators.hasSetupPy) confidence += 0.4;
    if (indicators.hasPyprojectToml) confidence += 0.4;

    // Secondary indicators (moderate evidence)
    if (indicators.hasEntryPoint) confidence += 0.3;
    if (indicators.hasCodeFiles) confidence += 0.25;
    if (indicators.hasSourceDir) confidence += 0.2;
    if (indicators.hasConfigFiles) confidence += 0.15;
    if (indicators.hasTestFiles) confidence += 0.1;
    if (indicators.hasReadme) confidence += 0.1;
    if (indicators.hasDockerfile) confidence += 0.1;

    // Tertiary indicators (weak evidence)
    if (indicators.hasLicense) confidence += 0.05;
    if (indicators.hasGitignore) confidence += 0.05;
    if (indicators.hasPublicAssets) confidence += 0.05;

    // File count bonus
    if (files.length >= 5) confidence += 0.1;
    if (files.length >= 10) confidence += 0.1;
    if (files.length >= 20) confidence += 0.1;

    // Penalties for non-tool directories
    if (indicators.hasNodeModules) confidence -= 0.3;
    if (indicators.hasVendor) confidence -= 0.2;
    if (indicators.hasBuildOutput) confidence -= 0.1;

    // Language and framework detection
    const language = this.detectLanguage(files);
    const framework = await this.detectFramework(zip, files);
    const techStack = this.detectTechStack(files);
    
    if (language !== 'Unknown') confidence += 0.15;
    if (framework) confidence += 0.2;
    if (techStack.length > 0) confidence += 0.1;

    // Advanced pattern matching for specific tool types
    const toolPatterns = await this.detectToolPatterns(zip, files, dirName);
    confidence += toolPatterns.confidenceBonus;

    // Find entry point
    const entryPoint = this.findEntryPoint(files);
    
    // Extract dependencies with enhanced parsing
    const dependencies = await this.extractDependencies(zip, files);

    // Generate enhanced tool name
    const name = await this.generateEnhancedToolName(zip, dirName, files, entryPoint);
    
    // Determine category with enhanced logic
    const category = this.determineEnhancedCategory(name, techStack, files, dependencies);
    
    // Generate enhanced description
    const description = this.generateEnhancedDescription(name, language, framework, techStack, toolPatterns);

    console.log(`Final enhanced confidence for ${dirName}: ${confidence.toFixed(3)}`);
    
    // Lower threshold but with better quality detection
    if (confidence < 0.15) return null;

    return {
      name,
      path: dirName === 'root' ? '.' : dirName,
      confidence: Math.min(confidence, 1.0),
      language,
      framework,
      techStack,
      entryPoint,
      hasTests: indicators.hasTestFiles,
      hasConfig: indicators.hasConfigFiles,
      hasDocumentation: indicators.hasReadme,
      dependencies,
      category,
      description,
      files: files.map(f => f.split('/').pop() || f)
    };
  }

  /**
   * Detect specific tool patterns for better categorization
   */
  private static async detectToolPatterns(zip: JSZip, files: string[], dirName: string): Promise<{
    type: string;
    confidenceBonus: number;
    features: string[];
  }> {
    const patterns = {
      type: 'unknown',
      confidenceBonus: 0,
      features: []
    };

    const fileNames = files.map(f => f.toLowerCase()).join(' ');
    const dirNameLower = dirName.toLowerCase();

    // PDF Tools
    if (dirNameLower.includes('pdf') || fileNames.includes('pdf')) {
      patterns.type = 'pdf-tool';
      patterns.confidenceBonus += 0.3;
      patterns.features.push('PDF Processing');
    }

    // AI/ML Tools
    if (fileNames.includes('tensorflow') || fileNames.includes('pytorch') || 
        fileNames.includes('sklearn') || fileNames.includes('numpy') ||
        dirNameLower.includes('ai') || dirNameLower.includes('ml')) {
      patterns.type = 'ai-tool';
      patterns.confidenceBonus += 0.25;
      patterns.features.push('Machine Learning');
    }

    // Web Tools
    if (fileNames.includes('react') || fileNames.includes('vue') || 
        fileNames.includes('angular') || fileNames.includes('express')) {
      patterns.type = 'web-tool';
      patterns.confidenceBonus += 0.2;
      patterns.features.push('Web Development');
    }

    // CLI Tools
    if (fileNames.includes('cli') || fileNames.includes('command') ||
        files.some(f => f.includes('bin/')) || dirNameLower.includes('cli')) {
      patterns.type = 'cli-tool';
      patterns.confidenceBonus += 0.2;
      patterns.features.push('Command Line Interface');
    }

    // API Tools
    if (fileNames.includes('api') || fileNames.includes('server') ||
        fileNames.includes('fastapi') || fileNames.includes('flask') ||
        fileNames.includes('express')) {
      patterns.type = 'api-tool';
      patterns.confidenceBonus += 0.2;
      patterns.features.push('API Development');
    }

    // Data Processing Tools
    if (fileNames.includes('data') || fileNames.includes('csv') ||
        fileNames.includes('json') || fileNames.includes('xml') ||
        dirNameLower.includes('data') || dirNameLower.includes('process')) {
      patterns.type = 'data-tool';
      patterns.confidenceBonus += 0.15;
      patterns.features.push('Data Processing');
    }

    return patterns;
  }

  /**
   * Detect programming language from files
   */
  private static detectLanguage(files: string[]): string {
    const extensions = files.map(f => '.' + f.split('.').pop()?.toLowerCase()).filter(Boolean);
    
    for (const [language, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
      if (extensions.some(ext => exts.includes(ext))) {
        return language;
      }
    }
    
    return 'Unknown';
  }

  /**
   * Detect framework from files and content
   */
  private static async detectFramework(zip: JSZip, files: string[]): Promise<string | undefined> {
    const fileNames = files.map(f => f.toLowerCase());
    
    // Check file names first
    for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
      if (patterns.some(pattern => 
        fileNames.some(name => name.includes(pattern.toLowerCase()))
      )) {
        return framework;
      }
    }

    // Check package.json content if available
    const packageJsonFile = files.find(f => f.endsWith('package.json'));
    if (packageJsonFile) {
      try {
        const content = await zip.files[packageJsonFile].async('string');
        const packageJson = JSON.parse(content);
        const allDeps = { 
          ...packageJson.dependencies, 
          ...packageJson.devDependencies 
        };
        
        for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
          if (patterns.some(pattern => 
            Object.keys(allDeps).some(dep => dep.includes(pattern.toLowerCase()))
          )) {
            return framework;
          }
        }
      } catch (error) {
        // Ignore JSON parsing errors
      }
    }

    return undefined;
  }

  /**
   * Detect tech stack from files
   */
  private static detectTechStack(files: string[]): string[] {
    const stack = new Set<string>();
    const extensions = files.map(f => '.' + f.split('.').pop()?.toLowerCase());
    const fileNames = files.map(f => f.toLowerCase());

    // Add languages
    for (const [language, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
      if (extensions.some(ext => exts.includes(ext))) {
        stack.add(language);
      }
    }

    // Add build systems
    for (const [buildSystem, patterns] of Object.entries(BUILD_SYSTEMS)) {
      if (patterns.some(pattern => fileNames.some(name => name.includes(pattern.toLowerCase())))) {
        stack.add(buildSystem);
      }
    }

    // Add common technologies
    if (fileNames.some(name => name.includes('docker'))) stack.add('Docker');
    if (fileNames.some(name => name.includes('kubernetes') || name.includes('k8s'))) stack.add('Kubernetes');
    if (fileNames.some(name => name.includes('terraform'))) stack.add('Terraform');
    if (fileNames.some(name => name.includes('jest') || name.includes('test'))) stack.add('Testing');
    if (fileNames.some(name => name.includes('eslint') || name.includes('prettier'))) stack.add('Code Quality');

    return Array.from(stack);
  }

  /**
   * Find entry point file
   */
  private static findEntryPoint(files: string[]): string | undefined {
    for (const entryPoint of ENTRY_POINTS) {
      const found = files.find(f => f.endsWith(entryPoint));
      if (found) return found.split('/').pop();
    }
    
    // Fallback to first code file
    const codeFiles = files.filter(f => {
      const ext = '.' + f.split('.').pop()?.toLowerCase();
      return Object.values(LANGUAGE_EXTENSIONS).flat().includes(ext);
    });
    
    return codeFiles[0]?.split('/').pop();
  }

  /**
   * Extract dependencies from package files
   */
  private static async extractDependencies(zip: JSZip, files: string[]): Promise<string[]> {
    const dependencies: string[] = [];

    // Check package.json
    const packageJsonFile = files.find(f => f.endsWith('package.json'));
    if (packageJsonFile) {
      try {
        const content = await zip.files[packageJsonFile].async('string');
        const packageJson = JSON.parse(content);
        const allDeps = { 
          ...packageJson.dependencies, 
          ...packageJson.devDependencies 
        };
        dependencies.push(...Object.keys(allDeps));
      } catch (error) {
        // Ignore errors
      }
    }

    // Check requirements.txt
    const requirementsFile = files.find(f => f.endsWith('requirements.txt'));
    if (requirementsFile) {
      try {
        const content = await zip.files[requirementsFile].async('string');
        const deps = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
          .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
        dependencies.push(...deps);
      } catch (error) {
        // Ignore errors
      }
    }

    return dependencies.slice(0, 10); // Limit to first 10 dependencies
  }

  /**
   * Generate enhanced tool name with better parsing
   */
  private static async generateEnhancedToolName(zip: JSZip, dirName: string, files: string[], entryPoint?: string): Promise<string> {
    // Try to extract name from package.json first
    const packageJsonFile = files.find(f => f.endsWith('package.json'));
    if (packageJsonFile) {
      try {
        const content = await zip.files[packageJsonFile].async('string');
        const packageJson = JSON.parse(content);
        if (packageJson.name) {
          return packageJson.name
            .replace(/[@\/]/g, '')
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      } catch (error) {
        // Continue with fallback methods
      }
    }

    // Try to extract from Cargo.toml
    const cargoFile = files.find(f => f.endsWith('Cargo.toml'));
    if (cargoFile) {
      try {
        const content = await zip.files[cargoFile].async('string');
        const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
        if (nameMatch) {
          return nameMatch[1]
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      } catch (error) {
        // Continue with fallback methods
      }
    }

    // Try to extract from setup.py
    const setupPyFile = files.find(f => f.endsWith('setup.py'));
    if (setupPyFile) {
      try {
        const content = await zip.files[setupPyFile].async('string');
        const nameMatch = content.match(/name\s*=\s*['"']([^'"]+)['"']/);
        if (nameMatch) {
          return nameMatch[1]
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      } catch (error) {
        // Continue with fallback methods
      }
    }

    // Fallback to directory name processing
    if (dirName !== 'root') {
      return dirName
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Fallback to entry point
    if (entryPoint) {
      const baseName = entryPoint.replace(/\.[^/.]+$/, '');
      return baseName
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return 'Detected Tool';
  }

  /**
   * Generate tool name from directory and files (legacy method)
   */
  private static generateToolName(dirName: string, files: string[], entryPoint?: string): string {
    if (dirName !== 'root') {
      return dirName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    if (entryPoint) {
      const baseName = entryPoint.replace(/\.[^/.]+$/, '');
      return baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/[-_]/g, ' ');
    }

    return 'Unknown Tool';
  }

  /**
   * Determine enhanced tool category with better logic
   */
  private static determineEnhancedCategory(name: string, techStack: string[], files: string[], dependencies: string[]): string {
    const nameLower = name.toLowerCase();
    const fileNames = files.map(f => f.toLowerCase()).join(' ');
    const stackStr = techStack.join(' ').toLowerCase();
    const depsStr = dependencies.join(' ').toLowerCase();

    // PDF Tools
    if (nameLower.includes('pdf') || fileNames.includes('pdf') || depsStr.includes('pdf')) {
      return 'pdf';
    }

    // AI/ML Tools
    if (nameLower.includes('ai') || nameLower.includes('ml') || nameLower.includes('neural') ||
        stackStr.includes('tensorflow') || stackStr.includes('pytorch') || stackStr.includes('sklearn') ||
        depsStr.includes('tensorflow') || depsStr.includes('torch') || depsStr.includes('numpy') ||
        depsStr.includes('pandas') || depsStr.includes('scikit')) {
      return 'ai';
    }

    // Business Tools
    if (nameLower.includes('business') || nameLower.includes('crm') || nameLower.includes('invoice') ||
        nameLower.includes('accounting') || nameLower.includes('finance') || nameLower.includes('sales') ||
        nameLower.includes('erp') || nameLower.includes('hr')) {
      return 'business';
    }

    // Design Tools
    if (nameLower.includes('design') || nameLower.includes('image') || nameLower.includes('graphics') ||
        nameLower.includes('photo') || nameLower.includes('canvas') || nameLower.includes('svg') ||
        depsStr.includes('canvas') || depsStr.includes('fabric') || depsStr.includes('konva')) {
      return 'design';
    }

    // Development Tools
    if (stackStr.includes('react') || stackStr.includes('vue') || stackStr.includes('angular') ||
        stackStr.includes('express') || stackStr.includes('fastapi') || stackStr.includes('django') ||
        nameLower.includes('dev') || nameLower.includes('api') || nameLower.includes('cli') ||
        nameLower.includes('build') || nameLower.includes('deploy') || nameLower.includes('test')) {
      return 'development';
    }

    // Default to productivity
    return 'productivity';
  }

  /**
   * Determine tool category (legacy method)
   */
  private static determineCategory(name: string, techStack: string[], files: string[]): string {
    const nameLower = name.toLowerCase();
    const fileNames = files.map(f => f.toLowerCase()).join(' ');
    const stackStr = techStack.join(' ').toLowerCase();

    if (nameLower.includes('pdf') || fileNames.includes('pdf')) return 'pdf';
    if (nameLower.includes('ai') || nameLower.includes('ml') || stackStr.includes('tensorflow') || stackStr.includes('pytorch')) return 'ai';
    if (nameLower.includes('business') || nameLower.includes('crm') || nameLower.includes('invoice')) return 'business';
    if (nameLower.includes('design') || nameLower.includes('image') || nameLower.includes('graphics')) return 'design';
    if (stackStr.includes('react') || stackStr.includes('vue') || stackStr.includes('angular') || nameLower.includes('dev')) return 'development';
    
    return 'productivity';
  }

  /**
   * Generate enhanced tool description with pattern analysis
   */
  private static generateEnhancedDescription(
    name: string, 
    language: string, 
    framework?: string, 
    techStack?: string[], 
    toolPatterns?: { type: string; features: string[] }
  ): string {
    const parts: string[] = [];
    
    // Add tool type specific description
    if (toolPatterns?.type && toolPatterns.type !== 'unknown') {
      switch (toolPatterns.type) {
        case 'pdf-tool':
          parts.push('A powerful PDF processing tool');
          break;
        case 'ai-tool':
          parts.push('An AI-powered analysis tool');
          break;
        case 'web-tool':
          parts.push('A modern web application');
          break;
        case 'cli-tool':
          parts.push('A command-line utility');
          break;
        case 'api-tool':
          parts.push('A REST API service');
          break;
        case 'data-tool':
          parts.push('A data processing utility');
          break;
        default:
          parts.push(`A ${language} tool`);
      }
    } else {
      parts.push(`A ${language} tool`);
    }

    // Add framework information
    if (framework) {
      parts.push(`built with ${framework}`);
    }

    // Add technology stack
    if (techStack && techStack.length > 0) {
      const mainTech = techStack.slice(0, 3);
      if (mainTech.length > 1) {
        parts.push(`using ${mainTech.join(', ')}`);
      }
    }

    // Add features if available
    if (toolPatterns?.features && toolPatterns.features.length > 0) {
      parts.push(`featuring ${toolPatterns.features.join(', ')}`);
    }

    return `${name} - ${parts.join(' ')}.`;
  }

  /**
   * Generate tool description (legacy method)
   */
  private static generateDescription(name: string, language: string, framework?: string, techStack?: string[]): string {
    const parts = [
      `A ${language} tool`,
      framework ? `built with ${framework}` : '',
      techStack && techStack.length > 0 ? `using ${techStack.slice(0, 3).join(', ')}` : ''
    ].filter(Boolean);

    return `${name} - ${parts.join(' ')}.`;
  }

  /**
   * Detect shared dependencies across tools
   */
  private static detectSharedDependencies(files: string[]): string[] {
    const packageJsonFiles = files.filter(f => f.endsWith('package.json'));
    if (packageJsonFiles.length < 2) return [];

    // This would need async processing to read file contents
    // For now, return common shared dependencies
    return ['react', 'typescript', 'webpack', 'babel'];
  }

  /**
   * Detect build systems in project
   */
  private static detectBuildSystems(files: string[]): string[] {
    const systems: string[] = [];
    const fileNames = files.map(f => f.toLowerCase());

    for (const [system, patterns] of Object.entries(BUILD_SYSTEMS)) {
      if (patterns.some(pattern => fileNames.some(name => name.includes(pattern.toLowerCase())))) {
        systems.push(system);
      }
    }

    return systems;
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(structure: ProjectStructure, tools: DetectedTool[]): string[] {
    const recommendations: string[] = [];

    if (structure.type === 'monorepo') {
      recommendations.push('🏗️ Consider using a monorepo management tool like Lerna or Nx');
      recommendations.push('📦 Set up shared dependency management for better consistency');
    }

    if (structure.type === 'multi-tool') {
      recommendations.push('🔧 Consider organizing tools in separate directories for better maintainability');
      recommendations.push('🚀 Set up individual deployment pipelines for each tool');
      
      // Check for mixed scenarios (root + directories)
      const hasRootTool = tools.some(t => t.path === '.');
      const hasDirectoryTools = tools.some(t => t.path !== '.');
      
      if (hasRootTool && hasDirectoryTools) {
        recommendations.push('🔀 Mixed project detected: Root-level files + subdirectory tools found');
        recommendations.push('📁 Consider moving root-level tool files into a dedicated directory for consistency');
        recommendations.push('⚡ Root-level tool will be created as "Main" project alongside subdirectory tools');
      }
    }

    const lowConfidenceTools = tools.filter(t => t.confidence < 0.7);
    if (lowConfidenceTools.length > 0) {
      recommendations.push(`⚠️ ${lowConfidenceTools.length} tools have low confidence scores - review their configuration`);
    }

    const toolsWithoutTests = tools.filter(t => !t.hasTests);
    if (toolsWithoutTests.length > 0) {
      recommendations.push(`🧪 ${toolsWithoutTests.length} tools are missing test files - consider adding tests`);
    }

    const toolsWithoutDocs = tools.filter(t => !t.hasDocumentation);
    if (toolsWithoutDocs.length > 0) {
      recommendations.push(`📚 ${toolsWithoutDocs.length} tools are missing documentation - add README files`);
    }

    return recommendations;
  }
}

/**
 * Analyze regular files (non-ZIP) for tool detection
 */
export async function analyzeRegularFiles(files: File[]): Promise<DetectedTool> {
  const fileNames = files.map(f => f.name);
  
  const language = ToolDetectionEngine['detectLanguage'](fileNames);
  const techStack = ToolDetectionEngine['detectTechStack'](fileNames);
  const entryPoint = ToolDetectionEngine['findEntryPoint'](fileNames);
  
  // Generate tool name from first file
  const firstName = files[0].name.replace(/\.[^/.]+$/, '');
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1).replace(/[-_]/g, ' ');
  
  const category = ToolDetectionEngine['determineCategory'](name, techStack, fileNames);
  const description = ToolDetectionEngine['generateDescription'](name, language, undefined, techStack);

  return {
    name,
    path: '.',
    confidence: 0.8,
    language,
    techStack,
    entryPoint,
    hasTests: fileNames.some(f => f.includes('test') || f.includes('spec')),
    hasConfig: fileNames.some(f => f.includes('config') || f.includes('.env')),
    hasDocumentation: fileNames.some(f => f.toLowerCase().includes('readme')),
    dependencies: [],
    category,
    description,
    files: fileNames
  };
}
