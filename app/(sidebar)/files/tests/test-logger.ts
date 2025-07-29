// Beautiful test logging utilities
export class TestLogger {
  private static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    
    // Background colors
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
  };

  static startTestSuite(name: string) {
    console.log('\n' + '='.repeat(80));
    console.log(`${this.colors.bright}${this.colors.cyan}🧪 TEST SUITE: ${name}${this.colors.reset}`);
    console.log('='.repeat(80) + '\n');
  }

  static startTest(name: string) {
    console.log(`\n${this.colors.bright}${this.colors.blue}📋 TEST: ${name}${this.colors.reset}`);
    console.log('─'.repeat(60));
  }

  static step(message: string) {
    console.log(`  ${this.colors.dim}▶${this.colors.reset} ${message}`);
  }

  static success(message: string) {
    console.log(`  ${this.colors.green}✅ SUCCESS:${this.colors.reset} ${message}`);
  }

  static error(message: string, error?: any) {
    console.log(`  ${this.colors.red}❌ ERROR:${this.colors.reset} ${message}`);
    if (error) {
      console.log(`     ${this.colors.dim}Details: ${error.message || error}${this.colors.reset}`);
    }
  }

  static warning(message: string) {
    console.log(`  ${this.colors.yellow}⚠️  WARNING:${this.colors.reset} ${message}`);
  }

  static info(message: string, data?: any) {
    console.log(`  ${this.colors.cyan}ℹ️  INFO:${this.colors.reset} ${message}`);
    if (data) {
      console.log(`     ${this.colors.dim}${JSON.stringify(data, null, 2)}${this.colors.reset}`);
    }
  }

  static metric(name: string, value: any, unit?: string) {
    const unitStr = unit ? ` ${unit}` : '';
    console.log(`  ${this.colors.magenta}📊 METRIC:${this.colors.reset} ${name}: ${this.colors.bright}${value}${unitStr}${this.colors.reset}`);
  }

  static testResult(passed: boolean, message: string) {
    if (passed) {
      console.log(`\n  ${this.colors.bgGreen}${this.colors.black} PASS ${this.colors.reset} ${this.colors.green}${message}${this.colors.reset}`);
    } else {
      console.log(`\n  ${this.colors.bgRed}${this.colors.white} FAIL ${this.colors.reset} ${this.colors.red}${message}${this.colors.reset}`);
    }
  }

  static summary(total: number, passed: number, failed: number, duration: number) {
    console.log('\n' + '='.repeat(80));
    console.log(`${this.colors.bright}📊 TEST SUMMARY${this.colors.reset}`);
    console.log('─'.repeat(80));
    console.log(`  Total Tests: ${this.colors.bright}${total}${this.colors.reset}`);
    console.log(`  ${this.colors.green}Passed: ${passed}${this.colors.reset}`);
    console.log(`  ${this.colors.red}Failed: ${failed}${this.colors.reset}`);
    console.log(`  Duration: ${this.colors.cyan}${duration}ms${this.colors.reset}`);
    console.log(`  Success Rate: ${this.colors.bright}${((passed / total) * 100).toFixed(1)}%${this.colors.reset}`);
    console.log('='.repeat(80) + '\n');
  }

  static separator() {
    console.log('─'.repeat(60));
  }

  static progress(current: number, total: number, message?: string) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const msg = message ? ` - ${message}` : '';
    console.log(`  Progress: [${bar}] ${percentage}%${msg}`);
  }
}