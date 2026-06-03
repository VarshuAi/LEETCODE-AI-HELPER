const vscode = require('vscode');
const WelcomeProvider = require('./welcomeProvider');
const SidebarProvider = require('./sidebarProvider');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Activating VCode Companion extension...');

    // Welcome Panel Provider
    const welcomeProvider = new WelcomeProvider(context);

    // Sidebar View Provider
    const sidebarProvider = new SidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('vcode-gemini-chat', sidebarProvider)
    );

    // Command: Open Welcome Screen
    let openWelcomeCmd = vscode.commands.registerCommand('vcode.openWelcome', () => {
        welcomeProvider.show();
    });
    context.subscriptions.push(openWelcomeCmd);

    // Command: Configure Gemini API Key
    let configureApiKeyCmd = vscode.commands.registerCommand('vcode.configureApiKey', async () => {
        const config = vscode.workspace.getConfiguration('vcode');
        const currentKey = config.get('geminiApiKey') || '';
        
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Google Gemini API Key',
            placeHolder: 'e.g. AIzaSy...',
            value: currentKey,
            ignoreFocusOut: true,
            password: true
        });

        if (apiKey !== undefined) {
            await config.update('geminiApiKey', apiKey, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('VCode Gemini API Key updated successfully!');
        }
    });
    context.subscriptions.push(configureApiKeyCmd);

    // Command: Apply Carbon Slate Theme
    let applyThemeCmd = vscode.commands.registerCommand('vcode.applyTheme', async () => {
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        await workbenchConfig.update('colorTheme', 'VCode Carbon Slate', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Welcome to VCode! Carbon Slate Theme applied successfully.');
    });
    context.subscriptions.push(applyThemeCmd);

    // Command: Apply macOS Dark Theme
    let applyMacThemeCmd = vscode.commands.registerCommand('vcode.applyMacTheme', async () => {
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        await workbenchConfig.update('colorTheme', 'VCode macOS Dark', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Welcome to VCode! macOS Dark Theme applied successfully.');
    });
    context.subscriptions.push(applyMacThemeCmd);

    // Automatically trigger Welcome Screen on first startup
    const welcomeStateKey = 'vcode.welcomeScreenShown';
    const hasWelcomeBeenShown = context.globalState.get(welcomeStateKey);
    if (!hasWelcomeBeenShown) {
        vscode.commands.executeCommand('vcode.openWelcome');
        context.globalState.update(welcomeStateKey, true);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
