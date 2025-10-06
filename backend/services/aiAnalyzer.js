const { parentPort, workerData } = require('worker_threads');
const path = require('path');

class AIToolAnalyzer {
  constructor() {
    this.patterns = {
      // Framework patterns
      frameworks: {
        'React': [/import.*react/i, /from\s+['"]react['"]/, /React\./],
        'Vue.js': [/import.*vue/i, /from\s+['"]vue['"]/, /Vue\./],
        'Angular': [/import.*@angular/i, /@Component/, /@Injectable/],
        'Express.js': [/require\(['"]express['"]\)/, /import.*express/, /app\.get\(/],
        'Next.js': [/import.*next/, /from\s+['"]next/, /getStaticProps/],
        'Nuxt.js': [/import.*nuxt/, /from\s+['"]nuxt/, /asyncData/],
        'Django': [/from django/, /import django/, /models\.Model/],
        'Flask': [/from flask/, /import flask/, /app = Flask/],
        'FastAPI': [/from fastapi/, /import fastapi/, /FastAPI\(/],
        'Spring Boot': [/@SpringBootApplication/, /@RestController/, /import org\.springframework/],
        'Laravel': [/use Illuminate/, /Route::/, /Artisan::/],
        'Rails': [/require ['"]rails['"]/, /class.*< ApplicationController/, /has_many/]
      },

      // Technology patterns
      technologies: {
        'TypeScript': [/\.ts$/, /interface\s+\w+/, /type\s+\w+\s*=/],
        'GraphQL': [/type Query/, /mutation/, /subscription/],
        'REST API': [/app\.get\(/, /app\.post\(/, /@GetMapping/, /@PostMapping/],
        'WebSocket': [/WebSocket/, /socket\.io/, /ws:/],
        'Database': [/mongoose/, /sequelize/, /prisma/, /SELECT.*FROM/],
        'Authentication': [/passport/, /jwt/, /bcrypt/, /auth/],
        'Testing': [/jest/, /mocha/, /chai/, /pytest/, /unittest/],
        'Docker': [/FROM\s+\w+/, /RUN\s+/, /COPY\s+/],
        'Kubernetes': [/apiVersion:/, /kind:/, /metadata:/],
        'Redis': [/redis/, /REDIS/, /redisClient/],
        'MongoDB': [/mongodb/, /mongoose/, /db\.collection/],
        'PostgreSQL': [/postgresql/, /pg/, /SELECT.*FROM/],
        'Machine Learning': [/tensorflow/, /pytorch/, /sklearn/, /pandas/, /numpy/],
        'Blockchain': [/web3/, /ethereum/, /solidity/, /truffle/]
      },

      // Security patterns
      security: {
        'Authentication': [/passport/, /jwt/, /oauth/, /session/],
        'Encryption': [/crypto/, /bcrypt/, /hash/, /encrypt/],
        'HTTPS': [/https:/, /ssl/, /tls/],
        'CORS': [/cors/, /Access-Control/, /origin/],
        'Input Validation': [/validator/, /joi/, /yup/, /sanitize/],
        'Rate Limiting': [/rate.?limit/, /throttle/, /express-rate-limit/]
      },

      // Performance patterns
      performance: {
        'Caching': [/cache/, /redis/, /memcached/, /localStorage/],
        'CDN': [/cdn/, /cloudfront/, /cloudflare/],
        'Compression': [/gzip/, /compress/, /minify/],
        'Lazy Loading': [/lazy/, /dynamic.*import/, /loadable/],
        'Code Splitting': [/chunk/, /split/, /dynamic.*import/],
        'Service Worker': [/service.?worker/, /sw\.js/, /workbox/]
      },

      // Architecture patterns
      architecture: {
        'Microservices': [/microservice/, /service.*mesh/, /api.*gateway/],
        'Serverless': [/lambda/, /serverless/, /function.*as.*service/],
        'Event Driven': [/event/, /message.*queue/, /pub.*sub/],
        'CQRS': [/command/, /query/, /event.*sourcing/],
        'Clean Architecture': [/clean.*architecture/, /domain.*driven/, /hexagonal/],
        'MVC': [/model/, /view/, /controller/]
      }
    };

    this.riskPatterns = {
      critical: [
        /eval\s*\(/gi,
        /exec\s*\(/gi,
        /system\s*\(/gi,
        /shell_exec\s*\(/gi,
        /passthru\s*\(/gi,
        /proc_open\s*\(/gi
      ],
      high: [
        /file_get_contents\s*\(/gi,
        /file_put_contents\s*\(/gi,
        /fopen\s*\(/gi,
        /fwrite\s*\(/gi,
        /require\s*\(/gi,
        /include\s*\(/gi,
        /import\s+os/gi,
        /import\s+subprocess/gi
      ],
      medium: [
        /process\.env/gi,
        /child_process/gi,
        /fs\.readFile/gi,
        /fs\.writeFile/gi,
        /innerHTML\s*=/gi,
        /document\.write/gi
      ],
      low: [
        /console\.log/gi,
        /alert\s*\(/gi,
        /confirm\s*\(/gi,
        /prompt\s*\(/gi
      ]
    };
  }

  analyze(files) {
    const analysis = {
      languages: this.detectLanguages(files),
      frameworks: this.detectFrameworks(files),
      technologies: this.detectTechnologies(files),
      architecture: this.detectArchitecture(files),
      security: this.analyzeSecurityFeatures(files),
      performance: this.analyzePerformanceFeatures(files),
      complexity: this.calculateComplexity(files),
      quality: this.assessCodeQuality(files),
      risks: this.analyzeSecurityRisks(files),
      recommendations: [],
      confidence: 0,
      metadata: {
        totalFiles: files.length,
        totalLines: files.reduce((acc, f) => acc + f.content.split('\n').length, 0),
        totalSize: files.reduce((acc, f) => acc + f.content.length, 0)
      }
    };

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    
    // Calculate overall confidence
    analysis.confidence = this.calculateConfidence(analysis);

    return analysis;
  }

  detectLanguages(files) {
    const languages = new Set();
    
    files.forEach(file => {
      const ext = path.extname(file.name).toLowerCase();
      const content = file.content.toLowerCase();
      
      // Extension-based detection
      const extMap = {
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.py': 'Python',
        '.go': 'Go',
        '.rs': 'Rust',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.swift': 'Swift',
        '.kt': 'Kotlin',
        '.cs': 'C#',
        '.scala': 'Scala',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.less': 'LESS',
        '.sql': 'SQL',
        '.sh': 'Shell',
        '.dockerfile': 'Docker'
      };
      
      if (extMap[ext]) {
        languages.add(extMap[ext]);
      }
      
      // Content-based detection
      if (content.includes('def ') && content.includes('import ')) languages.add('Python');
      if (content.includes('func ') && content.includes('package ')) languages.add('Go');
      if (content.includes('fn ') && content.includes('use ')) languages.add('Rust');
      if (content.includes('public class') && content.includes('import ')) languages.add('Java');
      if (content.includes('<?php')) languages.add('PHP');
      if (content.includes('class ') && content.includes('def ')) languages.add('Ruby');
    });
    
    return Array.from(languages);
  }

  detectFrameworks(files) {
    const detected = new Set();
    
    files.forEach(file => {
      const content = file.content;
      
      Object.entries(this.patterns.frameworks).forEach(([framework, patterns]) => {
        if (patterns.some(pattern => pattern.test(content))) {
          detected.add(framework);
        }
      });
    });
    
    return Array.from(detected);
  }

  detectTechnologies(files) {
    const detected = new Set();
    
    files.forEach(file => {
      const content = file.content;
      const filename = file.name;
      
      Object.entries(this.patterns.technologies).forEach(([tech, patterns]) => {
        if (patterns.some(pattern => {
          if (typeof pattern === 'string') {
            return filename.includes(pattern);
          }
          return pattern.test(content);
        })) {
          detected.add(tech);
        }
      });
    });
    
    return Array.from(detected);
  }

  detectArchitecture(files) {
    const detected = new Set();
    
    files.forEach(file => {
      const content = file.content.toLowerCase();
      
      Object.entries(this.patterns.architecture).forEach(([arch, patterns]) => {
        if (patterns.some(pattern => pattern.test(content))) {
          detected.add(arch);
        }
      });
    });
    
    // Infer architecture from structure
    const hasControllers = files.some(f => f.name.includes('controller'));
    const hasModels = files.some(f => f.name.includes('model'));
    const hasViews = files.some(f => f.name.includes('view') || f.name.includes('template'));
    
    if (hasControllers && hasModels && hasViews) {
      detected.add('MVC');
    }
    
    const hasServices = files.some(f => f.name.includes('service'));
    const hasRepositories = files.some(f => f.name.includes('repository'));
    
    if (hasServices && hasRepositories) {
      detected.add('Clean Architecture');
    }
    
    return Array.from(detected);
  }

  analyzeSecurityFeatures(files) {
    const features = new Set();
    
    files.forEach(file => {
      const content = file.content.toLowerCase();
      
      Object.entries(this.patterns.security).forEach(([feature, patterns]) => {
        if (patterns.some(pattern => pattern.test(content))) {
          features.add(feature);
        }
      });
    });
    
    return Array.from(features);
  }

  analyzePerformanceFeatures(files) {
    const features = new Set();
    
    files.forEach(file => {
      const content = file.content.toLowerCase();
      
      Object.entries(this.patterns.performance).forEach(([feature, patterns]) => {
        if (patterns.some(pattern => pattern.test(content))) {
          features.add(feature);
        }
      });
    });
    
    return Array.from(features);
  }

  calculateComplexity(files) {
    let totalComplexity = 0;
    let totalFunctions = 0;
    
    files.forEach(file => {
      const content = file.content;
      
      // Count functions/methods
      const functionPatterns = [
        /function\s+\w+/g,
        /\w+\s*:\s*function/g,
        /\w+\s*=>\s*/g,
        /def\s+\w+/g,
        /func\s+\w+/g,
        /fn\s+\w+/g
      ];
      
      functionPatterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        totalFunctions += matches.length;
      });
      
      // Calculate cyclomatic complexity (simplified)
      const complexityPatterns = [
        /if\s*\(/g,
        /else\s*if/g,
        /while\s*\(/g,
        /for\s*\(/g,
        /switch\s*\(/g,
        /case\s+/g,
        /catch\s*\(/g,
        /&&/g,
        /\|\|/g
      ];
      
      complexityPatterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        totalComplexity += matches.length;
      });
    });
    
    return {
      total: totalComplexity,
      average: totalFunctions > 0 ? totalComplexity / totalFunctions : 0,
      functions: totalFunctions,
      rating: this.getComplexityRating(totalComplexity, totalFunctions)
    };
  }

  getComplexityRating(complexity, functions) {
    const avgComplexity = functions > 0 ? complexity / functions : 0;
    
    if (avgComplexity <= 5) return 'Low';
    if (avgComplexity <= 10) return 'Medium';
    if (avgComplexity <= 20) return 'High';
    return 'Very High';
  }

  assessCodeQuality(files) {
    const quality = {
      score: 100,
      issues: [],
      metrics: {
        documentation: 0,
        testing: 0,
        structure: 0,
        naming: 0
      }
    };
    
    let totalLines = 0;
    let commentLines = 0;
    let testFiles = 0;
    
    files.forEach(file => {
      const lines = file.content.split('\n');
      totalLines += lines.length;
      
      // Count comments
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('#') || 
            trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          commentLines++;
        }
      });
      
      // Check for test files
      if (file.name.includes('test') || file.name.includes('spec')) {
        testFiles++;
      }
      
      // Check naming conventions
      const hasGoodNaming = /^[a-z][a-zA-Z0-9]*$/.test(file.name.split('.')[0]);
      if (!hasGoodNaming) {
        quality.issues.push(`Poor naming convention: ${file.name}`);
        quality.score -= 5;
      }
    });
    
    // Documentation score
    quality.metrics.documentation = Math.min(100, (commentLines / totalLines) * 100 * 5);
    
    // Testing score
    quality.metrics.testing = Math.min(100, (testFiles / files.length) * 100 * 2);
    
    // Structure score (based on file organization)
    const hasStructure = files.some(f => f.name.includes('/') || f.name.includes('\\'));
    quality.metrics.structure = hasStructure ? 80 : 40;
    
    // Overall quality score
    quality.score = Math.max(0, Math.min(100, 
      (quality.metrics.documentation + quality.metrics.testing + quality.metrics.structure) / 3
    ));
    
    return quality;
  }

  analyzeSecurityRisks(files) {
    const risks = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      score: 100
    };
    
    files.forEach(file => {
      const content = file.content;
      
      Object.entries(this.riskPatterns).forEach(([level, patterns]) => {
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              risks[level].push({
                file: file.name,
                pattern: match,
                line: this.findLineNumber(content, match)
              });
            });
          }
        });
      });
    });
    
    // Calculate risk score
    risks.score = 100 - (
      risks.critical.length * 25 +
      risks.high.length * 15 +
      risks.medium.length * 8 +
      risks.low.length * 3
    );
    
    risks.score = Math.max(0, risks.score);
    
    return risks;
  }

  findLineNumber(content, match) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 1;
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Security recommendations
    if (analysis.risks.critical.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'critical',
        message: `Found ${analysis.risks.critical.length} critical security issues. Review immediately.`
      });
    }
    
    if (analysis.security.length === 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        message: 'No security features detected. Consider adding authentication and input validation.'
      });
    }
    
    // Performance recommendations
    if (analysis.performance.length === 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'No performance optimizations detected. Consider adding caching and compression.'
      });
    }
    
    // Code quality recommendations
    if (analysis.quality.score < 50) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: 'Low code quality score. Improve documentation and testing.'
      });
    }
    
    // Complexity recommendations
    if (analysis.complexity.rating === 'Very High') {
      recommendations.push({
        type: 'complexity',
        priority: 'high',
        message: 'Very high complexity detected. Consider refactoring complex functions.'
      });
    }
    
    // Architecture recommendations
    if (analysis.architecture.length === 0) {
      recommendations.push({
        type: 'architecture',
        priority: 'low',
        message: 'No clear architecture pattern detected. Consider implementing MVC or Clean Architecture.'
      });
    }
    
    return recommendations;
  }

  calculateConfidence(analysis) {
    let confidence = 0;
    
    // Language detection confidence
    if (analysis.languages.length > 0) confidence += 20;
    
    // Framework detection confidence
    if (analysis.frameworks.length > 0) confidence += 25;
    
    // Technology detection confidence
    if (analysis.technologies.length > 0) confidence += 20;
    
    // File structure confidence
    if (analysis.metadata.totalFiles > 1) confidence += 15;
    
    // Code quality confidence
    if (analysis.quality.score > 50) confidence += 10;
    
    // Security analysis confidence
    if (analysis.security.length > 0) confidence += 10;
    
    return Math.min(100, confidence);
  }
}

// Worker thread execution
if (parentPort) {
  const analyzer = new AIToolAnalyzer();
  const analysis = analyzer.analyze(workerData.files);
  parentPort.postMessage(analysis);
}
