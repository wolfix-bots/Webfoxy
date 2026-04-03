// commands/tools/calc.js
import { foxCanUse, foxMode } from '../../utils/foxMaster.js';

export default {
    name: 'calc',
    alias: ['calculate', 'math', 'calculator'],
    category: 'tools',
    description: 'Simple calculator with advanced operations',
    
    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'calc')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }

        const jid = msg.key.remoteJid;
        
        // Show help if no arguments
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY CALCULATOR* ⧭─┐
│
├─⧭ *What can I calculate?*
│ I can solve mathematical expressions!
│
├─⧭ *Usage:*
│ ${prefix}calc <expression>
│
├─⧭ *Basic Operations:*
│ • Addition: 5 + 3
│ • Subtraction: 10 - 4
│ • Multiplication: 6 * 7
│ • Division: 15 / 3
│ • Power: 2 ^ 3
│ • Square root: sqrt(16)
│ • Percentage: 20% of 150
│ • Parentheses: (5 + 3) * 2
│
├─⧭ *Examples:*
│ ${prefix}calc 5 + 3 * 2
│ ${prefix}calc (10 + 5) / 3
│ ${prefix}calc 2^4 + 10
│ ${prefix}calc 20% of 200
│ ${prefix}calc sqrt(25) * 2
│
├─⧭ *Advanced Examples:*
│ ${prefix}calc (15% of 80) + 10
│ ${prefix}calc sqrt(144) / 2
│ ${prefix}calc 2^3 * (5 + 3)
│
└─⧭🦊 *Do the math!*`
            }, { quoted: msg });
        }

        // Help command
        if (args[0].toLowerCase() === 'help') {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *CALCULATOR HELP* ⧭─┐
│
├─⧭ *How to use:*
│ Just type your expression after .calc
│
├─⧭ *Supported Functions:*
│ • Basic: + - * / ^
│ • Square root: sqrt(number)
│ • Percentage: X% of Y
│ • Parentheses: ( )
│ • Decimals: 3.14
│
├─⧭ *Order of Operations:*
│ 1. Parentheses first
│ 2. Exponents (^)
│ 3. Multiplication/Division
│ 4. Addition/Subtraction
│
├─⧭ *Tips:*
│ • Use spaces between numbers
│ • Use ^ for power (2^3 = 8)
│ • Use % for percentage
│ • Use sqrt() for square root
│
└─⧭🦊`
            }, { quoted: msg });
        }

        const expression = args.join(' ');
        
        // Send processing message
        await sock.sendMessage(jid, {
            text: `┌─⧭ *CALCULATING* ⧭─┐
│
│ 🧮 Processing: ${expression}
│
│ Please wait a moment...
│
└─⧭🦊`
        }, { quoted: msg });
        
        try {
            // Prepare expression for evaluation
            let result = expression;
            
            // Handle percentage of format
            if (result.includes('% of')) {
                const percentMatch = result.match(/(\d+(?:\.\d+)?)%\s+of\s+(\d+(?:\.\d+)?)/);
                if (percentMatch) {
                    const percent = parseFloat(percentMatch[1]);
                    const number = parseFloat(percentMatch[2]);
                    result = (percent / 100) * number;
                }
            }
            // Handle standalone percentage
            else if (result.includes('%') && !result.includes('% of')) {
                const percentMatch = result.match(/(\d+(?:\.\d+)?)%/);
                if (percentMatch) {
                    const percent = parseFloat(percentMatch[1]);
                    result = percent / 100;
                }
            }
            
            // Handle square root
            const sqrtRegex = /sqrt\(([^)]+)\)/g;
            result = result.toString().replace(sqrtRegex, (match, num) => {
                const value = evaluateSimple(num);
                return Math.sqrt(value);
            });
            
            // Replace ^ with ** for exponentiation
            result = result.toString().replace(/\^/g, '**');
            
            // Remove any dangerous characters and evaluate
            const safeExpr = result.toString().replace(/[^0-9+\-*/().% ]/g, '');
            
            // If result is still a string with operators, evaluate it
            if (typeof result === 'string' && /[+\-*/()]/.test(result)) {
                result = eval(safeExpr);
            }
            
            // Validate result
            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation');
            }
            
            // Format the result nicely
            let formattedResult;
            if (Number.isInteger(result)) {
                formattedResult = result.toString();
            } else {
                formattedResult = parseFloat(result.toFixed(8)).toString();
                // Remove trailing zeros after decimal
                formattedResult = formattedResult.replace(/\.0+$/, '').replace(/(\.[0-9]*[1-9])0+$/, '$1');
            }
            
            // Create step-by-step breakdown
            const steps = [];
            if (expression.includes('+')) steps.push('Addition');
            if (expression.includes('-')) steps.push('Subtraction');
            if (expression.includes('*') || expression.includes('×')) steps.push('Multiplication');
            if (expression.includes('/') || expression.includes('÷')) steps.push('Division');
            if (expression.includes('^')) steps.push('Power/Exponent');
            if (expression.includes('sqrt')) steps.push('Square Root');
            if (expression.includes('%')) steps.push('Percentage');
            
            // Send the result
            await sock.sendMessage(jid, {
                text: `┌─⧭ *CALCULATION RESULT* ⧭─┐
│
├─⧭ *Expression:*
│ ${expression}
│
├─⧭ *Result:*
│ 📊 ${formattedResult}
│
├─⧭ *Operations Used:*
│ ${steps.length ? steps.map(s => `• ${s}`).join('\n│ ') : '• Direct evaluation'}
│
├─⧭ *Verification:*
│ Input: ${expression}
│ Output: ${formattedResult}
│ Type: ${typeof result}
│
├─⧭ *Quick Tips:*
│ • Use parentheses for complex: (5+3)*2
│ • Try percentage: 15% of 200
│ • Try square root: sqrt(144)
│
├─⧭ *Another calculation:*
│ ${prefix}calc <new expression>
│
└─⧭🦊 *Math solved by Foxy!*`
            }, { quoted: msg });
            
            // Add reaction
            await sock.sendMessage(jid, {
                react: { text: "🧮", key: msg.key }
            });
            
        } catch (error) {
            console.error('Calc error:', error);
            
            await sock.sendMessage(jid, {
                text: `┌─⧭ *CALCULATION FAILED* ⧭─┐
│
├─⧭ *Expression:*
│ ${expression}
│
├─⧭ *Error:*
│ ❌ ${error.message}
│
├─⧭ *Common Mistakes:*
│ • Missing operators (5+3 not 5 3)
│ • Unbalanced parentheses
│ • Invalid characters
│ • Division by zero
│ • Wrong format (use % of for percentages)
│
├─⧭ *Correct Format:*
│ ${prefix}calc 5 + 3 * 2
│ ${prefix}calc (10 + 5) / 3
│ ${prefix}calc 20% of 150
│ ${prefix}calc sqrt(25) * 2
│
└─⧭🦊 *Even foxes make math mistakes! Try again.*`
            }, { quoted: msg });
            
            // Add error reaction
            await sock.sendMessage(jid, {
                react: { text: "❌", key: msg.key }
            });
        }
    }
};

// Helper function for simple evaluation
function evaluateSimple(expr) {
    expr = expr.trim();
    if (/^[0-9.+\-*/()]+$/.test(expr)) {
        return eval(expr);
    }
    return parseFloat(expr) || 0;
}