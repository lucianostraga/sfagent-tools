import { test, expect } from './fixtures';

// Same utterance as specs/case-submission.ngt.yaml. The native test checks what the agent decides
// (subagent and response); this one checks what the user sees: the CLT form and the result card.
test('case submission renders the form and the result card', async ({ agentforce, page }) => {
  await agentforce.send('I need to submit a support case');

  const form = agentforce.component('c-case-input-editor');
  await expect(form).toBeVisible();
  await expect(form.getByText('Submit a Support Case')).toBeVisible();

  await form.getByLabel('Subject').fill('Playwright E2E check');
  await form.getByRole('combobox', { name: 'Priority' }).click();
  await page.getByRole('option', { name: 'High' }).click();
  await form.getByLabel('Description').fill('Created by the sfagent-tools UI test.');
  await agentforce.submitForm();

  const card = agentforce.component('c-case-result-renderer');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Case Submitted Successfully');
  await expect(card).toContainText(/CS-\d+/);
  await expect(card).toContainText('Playwright E2E check');
  await expect(card).toContainText('High');
});
