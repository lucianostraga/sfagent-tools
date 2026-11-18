import type { Locator, Page } from '@playwright/test';

// Page object for the Agentforce panel in Lightning Experience (employee agents).
// Uses roles and visible text only: the Lightning DOM is not a stable API.
export class AgentforcePanel {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Agentforce' }).click();
    await this.dismissFirstRunScreens();
  }

  // First-run screens can show up in any order (the memory dialog and the panel disclaimer), and
  // every fresh browser shows the disclaimer again. Close whatever appears until the composer is ready.
  private async dismissFirstRunScreens(): Promise<void> {
    const memory = this.page.getByText('Agentforce Learns from Your Conversations');
    const disclaimer = this.page.getByText('about to use Agentforce');
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      if (await this.composer().isVisible()) return;
      if (await memory.isVisible()) await this.page.keyboard.press('Escape');
      else if (await disclaimer.isVisible()) await this.page.getByRole('button', { name: 'Got It' }).last().click();
      await this.page.waitForTimeout(1_000);
    }
    throw new Error('The Agentforce panel did not become ready');
  }

  composer(): Locator {
    return this.page.getByRole('textbox', { name: /Chat message input/ });
  }

  // Sends a message and confirms it left the composer: right after the panel opens, Enter can arrive
  // before the panel is ready and the text just stays in the box.
  async send(utterance: string): Promise<void> {
    const box = this.composer();
    await box.fill(utterance);
    for (let attempt = 0; attempt < 5; attempt++) {
      await box.press('Enter');
      const sent = await box.evaluate((el: HTMLElement) =>
        new Promise<boolean>(resolve => {
          const read = () => ('value' in el ? (el as HTMLTextAreaElement).value : el.textContent ?? '');
          const started = Date.now();
          const tick = () => (read().trim() === '' ? resolve(true) : Date.now() - started > 5_000 ? resolve(false) : setTimeout(tick, 250));
          tick();
        }));
      if (sent) return;
    }
    throw new Error(`The Agentforce panel did not send: ${utterance}`);
  }

  // A Custom Lightning Type component rendered in the conversation, by its LWC tag (e.g. c-case-result-renderer).
  component(tag: string): Locator {
    return this.page.locator(tag).last();
  }

  // The Submit button the panel draws under a CLT editor form.
  async submitForm(): Promise<void> {
    await this.page.getByRole('button', { name: 'Submit', exact: true }).last().click();
  }
}
