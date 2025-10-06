const rateLimit = require('express-rate-limit');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// ============================================================================
// SECURITY MIDDLEWARE FOR TOOL EXECUTION
// ============================================================================

// Rate limiting for tool execution
const executionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each user to 5 tool executions per windowMs
  message: {
    error: 'Too many tool executions. Please wait before starting another tool.',
    retryAfter: '15 minutes'
  },
  keyGenerator: (req) => req.user.id, // Rate limit per user
  standardHeaders: true,
  legacyHeaders: false,
});

// Resource limits for tool execution
const RESOURCE_LIMITS = {
  maxMemory: 512 * 1024 * 1024, // 512MB
  maxCpuTime: 300, // 5 minutes
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxProcesses: 10,
  maxOpenFiles: 100,
  networkAccess: false, // Disable network access by default
  allowedPorts: [8000, 8001, 8002, 8003, 8004], // Allowed ports for web apps
};

// Sandbox configuration
const SANDBOX_CONFIG = {
  // Allowed system calls (whitelist approach)
  allowedSyscalls: [
    'read', 'write', 'open', 'close', 'stat', 'fstat', 'lstat',
    'poll', 'lseek', 'mmap', 'mprotect', 'munmap', 'brk',
    'rt_sigaction', 'rt_sigprocmask', 'rt_sigreturn', 'ioctl',
    'pread64', 'pwrite64', 'readv', 'writev', 'access', 'pipe',
    'select', 'sched_yield', 'mremap', 'msync', 'mincore',
    'madvise', 'shmget', 'shmat', 'shmctl', 'dup', 'dup2',
    'pause', 'nanosleep', 'getitimer', 'alarm', 'setitimer',
    'getpid', 'sendfile', 'socket', 'connect', 'accept', 'sendto',
    'recvfrom', 'sendmsg', 'recvmsg', 'shutdown', 'bind', 'listen',
    'getsockname', 'getpeername', 'socketpair', 'setsockopt',
    'getsockopt', 'clone', 'fork', 'vfork', 'execve', 'exit',
    'wait4', 'kill', 'uname', 'semget', 'semop', 'semctl',
    'shmdt', 'msgget', 'msgsnd', 'msgrcv', 'msgctl', 'fcntl',
    'flock', 'fsync', 'fdatasync', 'truncate', 'ftruncate',
    'getdents', 'getcwd', 'chdir', 'fchdir', 'rename', 'mkdir',
    'rmdir', 'creat', 'link', 'unlink', 'symlink', 'readlink',
    'chmod', 'fchmod', 'chown', 'fchown', 'lchown', 'umask',
    'gettimeofday', 'getrlimit', 'getrusage', 'sysinfo', 'times',
    'ptrace', 'getuid', 'syslog', 'getgid', 'setuid', 'setgid',
    'geteuid', 'getegid', 'setpgid', 'getppid', 'getpgrp',
    'setsid', 'setreuid', 'setregid', 'getgroups', 'setgroups',
    'setresuid', 'getresuid', 'setresgid', 'getresgid', 'getpgid',
    'setfsuid', 'setfsgid', 'getsid', 'capget', 'capset',
    'rt_sigpending', 'rt_sigtimedwait', 'rt_sigqueueinfo',
    'rt_sigsuspend', 'sigaltstack', 'utime', 'mknod', 'uselib',
    'personality', 'ustat', 'statfs', 'fstatfs', 'sysfs',
    'getpriority', 'setpriority', 'sched_setparam', 'sched_getparam',
    'sched_setscheduler', 'sched_getscheduler', 'sched_get_priority_max',
    'sched_get_priority_min', 'sched_rr_get_interval', 'mlock',
    'munlock', 'mlockall', 'munlockall', 'vhangup', 'modify_ldt',
    'pivot_root', '_sysctl', 'prctl', 'arch_prctl', 'adjtimex',
    'setrlimit', 'chroot', 'sync', 'acct', 'settimeofday',
    'mount', 'umount2', 'swapon', 'swapoff', 'reboot', 'sethostname',
    'setdomainname', 'iopl', 'ioperm', 'create_module', 'init_module',
    'delete_module', 'get_kernel_syms', 'query_module', 'quotactl',
    'nfsservctl', 'getpmsg', 'putpmsg', 'afs_syscall', 'tuxcall',
    'security', 'gettid', 'readahead', 'setxattr', 'lsetxattr',
    'fsetxattr', 'getxattr', 'lgetxattr', 'fgetxattr', 'listxattr',
    'llistxattr', 'flistxattr', 'removexattr', 'lremovexattr',
    'fremovexattr', 'tkill', 'time', 'futex', 'sched_setaffinity',
    'sched_getaffinity', 'set_thread_area', 'io_setup', 'io_destroy',
    'io_getevents', 'io_submit', 'io_cancel', 'get_thread_area',
    'lookup_dcookie', 'epoll_create', 'epoll_ctl_old', 'epoll_wait_old',
    'remap_file_pages', 'getdents64', 'set_tid_address', 'restart_syscall',
    'semtimedop', 'fadvise64', 'timer_create', 'timer_settime',
    'timer_gettime', 'timer_getoverrun', 'timer_delete', 'clock_settime',
    'clock_gettime', 'clock_getres', 'clock_nanosleep', 'exit_group',
    'epoll_wait', 'epoll_ctl', 'tgkill', 'utimes', 'vserver',
    'mbind', 'set_mempolicy', 'get_mempolicy', 'mq_open', 'mq_unlink',
    'mq_timedsend', 'mq_timedreceive', 'mq_notify', 'mq_getsetattr',
    'kexec_load', 'waitid', 'add_key', 'request_key', 'keyctl',
    'ioprio_set', 'ioprio_get', 'inotify_init', 'inotify_add_watch',
    'inotify_rm_watch', 'migrate_pages', 'openat', 'mkdirat',
    'mknodat', 'fchownat', 'futimesat', 'newfstatat', 'unlinkat',
    'renameat', 'linkat', 'symlinkat', 'readlinkat', 'fchmodat',
    'faccessat', 'pselect6', 'ppoll', 'unshare', 'set_robust_list',
    'get_robust_list', 'splice', 'tee', 'sync_file_range',
    'vmsplice', 'move_pages', 'utimensat', 'epoll_pwait',
    'signalfd', 'timerfd_create', 'eventfd', 'fallocate',
    'timerfd_settime', 'timerfd_gettime', 'accept4', 'signalfd4',
    'eventfd2', 'epoll_create1', 'dup3', 'pipe2', 'inotify_init1',
    'preadv', 'pwritev', 'rt_tgsigqueueinfo', 'perf_event_open',
    'recvmmsg', 'fanotify_init', 'fanotify_mark', 'prlimit64',
    'name_to_handle_at', 'open_by_handle_at', 'clock_adjtime',
    'syncfs', 'sendmmsg', 'setns', 'getcpu', 'process_vm_readv',
    'process_vm_writev', 'kcmp', 'finit_module'
  ],
  
  // Blocked system calls (dangerous operations)
  blockedSyscalls: [
    'ptrace', 'mount', 'umount2', 'swapon', 'swapoff', 'reboot',
    'sethostname', 'setdomainname', 'iopl', 'ioperm', 'create_module',
    'init_module', 'delete_module', 'quotactl', 'nfsservctl'
  ],
  
  // Environment restrictions
  blockedEnvVars: [
    'PATH', 'LD_LIBRARY_PATH', 'LD_PRELOAD', 'PYTHONPATH',
    'NODE_PATH', 'HOME', 'USER', 'LOGNAME'
  ],
  
  // File system restrictions
  readOnlyPaths: ['/etc', '/usr', '/lib', '/lib64', '/bin', '/sbin'],
  blockedPaths: ['/proc', '/sys', '/dev', '/tmp', '/var'],
  allowedPaths: [] // Will be set per execution
};

// Security validation middleware
const validateToolSecurity = async (req, res, next) => {
  try {
    const { toolId } = req.params;
    const userId = req.user.id;

    // Check if user has permission to execute this tool
    const tool = await req.db.findOne('tools', { 
      id: toolId, 
      user_id: userId 
    });

    if (!tool) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to execute this tool'
      });
    }

    // Check tool status
    if (tool.status !== 'active') {
      return res.status(400).json({
        error: 'Tool unavailable',
        message: 'This tool is not currently available for execution'
      });
    }

    // Get tool files for security analysis
    const toolFiles = await req.db.find('tool_files', { 
      tool_id: toolId 
    });

    // Perform security analysis on tool files
    const securityIssues = await analyzeToolSecurity(toolFiles);
    
    if (securityIssues.length > 0) {
      console.warn(`Security issues found in tool ${toolId}:`, securityIssues);
      
      // Log security issues
      await req.db.insert('tool_analytics', {
        tool_id: toolId,
        user_id: userId,
        event_type: 'security_warning',
        event_data: JSON.stringify({
          issues: securityIssues,
          timestamp: new Date().toISOString()
        })
      });

      // For now, allow execution but log warnings
      // In production, you might want to block execution for critical issues
    }

    req.tool = tool;
    req.toolFiles = toolFiles;
    req.securityIssues = securityIssues;
    
    next();
  } catch (error) {
    console.error('Security validation error:', error);
    res.status(500).json({
      error: 'Security validation failed',
      message: 'Unable to validate tool security'
    });
  }
};

// Analyze tool files for security issues
async function analyzeToolSecurity(toolFiles) {
  const issues = [];

  for (const file of toolFiles) {
    if (!file.content) continue;

    const content = file.content.toLowerCase();
    const filename = file.filename.toLowerCase();

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, severity: 'high', description: 'Use of eval() function' },
      { pattern: /exec\s*\(/, severity: 'high', description: 'Use of exec() function' },
      { pattern: /system\s*\(/, severity: 'critical', description: 'System command execution' },
      { pattern: /shell_exec\s*\(/, severity: 'critical', description: 'Shell command execution' },
      { pattern: /passthru\s*\(/, severity: 'critical', description: 'Passthru command execution' },
      { pattern: /file_get_contents\s*\(/, severity: 'medium', description: 'File access function' },
      { pattern: /fopen\s*\(/, severity: 'medium', description: 'File open function' },
      { pattern: /curl_exec\s*\(/, severity: 'medium', description: 'Network request function' },
      { pattern: /fetch\s*\(/, severity: 'medium', description: 'Network fetch function' },
      { pattern: /xmlhttprequest/i, severity: 'medium', description: 'AJAX request capability' },
      { pattern: /require\s*\(\s*['"]child_process['"]/, severity: 'high', description: 'Child process module' },
      { pattern: /require\s*\(\s*['"]fs['"]/, severity: 'medium', description: 'File system module' },
      { pattern: /require\s*\(\s*['"]net['"]/, severity: 'medium', description: 'Network module' },
      { pattern: /import\s+.*\s+from\s+['"]child_process['"]/, severity: 'high', description: 'Child process import' },
      { pattern: /import\s+.*\s+from\s+['"]fs['"]/, severity: 'medium', description: 'File system import' },
      { pattern: /import\s+.*\s+from\s+['"]net['"]/, severity: 'medium', description: 'Network import' },
      { pattern: /__import__\s*\(/, severity: 'high', description: 'Dynamic import function' },
      { pattern: /subprocess\./i, severity: 'high', description: 'Subprocess module usage' },
      { pattern: /os\.system/i, severity: 'critical', description: 'OS system command' },
      { pattern: /os\.popen/i, severity: 'critical', description: 'OS popen command' },
      { pattern: /socket\./i, severity: 'medium', description: 'Socket usage' },
      { pattern: /urllib/i, severity: 'medium', description: 'URL library usage' },
      { pattern: /requests\./i, severity: 'medium', description: 'HTTP requests library' }
    ];

    for (const { pattern, severity, description } of dangerousPatterns) {
      if (pattern.test(content)) {
        issues.push({
          file: filename,
          severity,
          description,
          pattern: pattern.toString()
        });
      }
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs'];
    if (suspiciousExtensions.some(ext => filename.endsWith(ext))) {
      issues.push({
        file: filename,
        severity: 'critical',
        description: 'Executable file detected',
        pattern: 'file_extension'
      });
    }

    // Check for large files (potential DoS)
    if (file.file_size > 10 * 1024 * 1024) { // 10MB
      issues.push({
        file: filename,
        severity: 'medium',
        description: 'Large file detected',
        pattern: 'file_size'
      });
    }
  }

  return issues;
}

// Create secure execution environment
const createSecureEnvironment = (sessionDir, config) => {
  const secureEnv = {
    // Minimal environment variables
    NODE_ENV: 'production',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    HOME: sessionDir,
    USER: 'sandbox',
    SHELL: '/bin/sh',
    
    // Resource limits
    RLIMIT_AS: RESOURCE_LIMITS.maxMemory,
    RLIMIT_CPU: RESOURCE_LIMITS.maxCpuTime,
    RLIMIT_FSIZE: RESOURCE_LIMITS.maxFileSize,
    RLIMIT_NPROC: RESOURCE_LIMITS.maxProcesses,
    RLIMIT_NOFILE: RESOURCE_LIMITS.maxOpenFiles,
    
    // Security settings
    SANDBOX_MODE: 'true',
    NETWORK_ACCESS: config.networkAccess ? 'true' : 'false'
  };

  // Remove blocked environment variables
  for (const blockedVar of SANDBOX_CONFIG.blockedEnvVars) {
    delete secureEnv[blockedVar];
  }

  return secureEnv;
};

// Apply resource limits to spawned process
const applyResourceLimits = (childProcess) => {
  try {
    // Set memory limit
    if (childProcess.pid) {
      const { spawn } = require('child_process');
      
      // Use cgroups for better resource control (Linux only)
      if (process.platform === 'linux') {
        spawn('cgcreate', ['-g', `memory:sandbox_${childProcess.pid}`]);
        spawn('cgset', ['-r', `memory.limit_in_bytes=${RESOURCE_LIMITS.maxMemory}`, `sandbox_${childProcess.pid}`]);
        spawn('cgclassify', ['-g', `memory:sandbox_${childProcess.pid}`, childProcess.pid.toString()]);
      }
    }
  } catch (error) {
    console.warn('Failed to apply resource limits:', error.message);
  }
};

// Monitor process resource usage
const monitorResourceUsage = (childProcess, session) => {
  const monitorInterval = setInterval(() => {
    if (!childProcess.pid) {
      clearInterval(monitorInterval);
      return;
    }

    try {
      const { spawn } = require('child_process');
      const ps = spawn('ps', ['-p', childProcess.pid.toString(), '-o', 'pid,ppid,pcpu,pmem,time,comm']);
      
      let output = '';
      ps.stdout.on('data', (data) => {
        output += data.toString();
      });

      ps.on('close', (code) => {
        if (code === 0 && output.trim()) {
          const lines = output.trim().split('\n');
          if (lines.length > 1) {
            const stats = lines[1].trim().split(/\s+/);
            const cpuUsage = parseFloat(stats[2]);
            const memUsage = parseFloat(stats[3]);
            
            session.logs.push(`Resource usage - CPU: ${cpuUsage}%, Memory: ${memUsage}%`);
            
            // Kill process if it exceeds limits
            if (cpuUsage > 80 || memUsage > 80) {
              session.logs.push('Process killed due to excessive resource usage');
              childProcess.kill('SIGKILL');
              clearInterval(monitorInterval);
            }
          }
        }
      });
    } catch (error) {
      // Ignore monitoring errors
    }
  }, 5000); // Monitor every 5 seconds

  // Clean up monitor when process exits
  childProcess.on('exit', () => {
    clearInterval(monitorInterval);
  });
};

module.exports = {
  executionRateLimit,
  validateToolSecurity,
  analyzeToolSecurity,
  createSecureEnvironment,
  applyResourceLimits,
  monitorResourceUsage,
  RESOURCE_LIMITS,
  SANDBOX_CONFIG
};
