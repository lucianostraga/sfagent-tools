// ============================================
// SFAgent Tools - Knowledge Articles for Agent Testing
// Run with: sf apex run --file scripts/seed-knowledge.apex --target-org sfagent-dev
//
// NOTE: Knowledge must be enabled in the org first.
// Setup > Knowledge Settings > Enable Knowledge
// ============================================

// Check if Knowledge is available
try {
    // Create Knowledge articles using the standard KnowledgeArticleVersion object
    // The actual object name depends on the Knowledge article type configured in the org
    // This script uses the standard FAQ article type if available

    System.debug('=== KNOWLEDGE ARTICLE SEEDING ===');
    System.debug('Knowledge articles must be created manually or via the Knowledge API.');
    System.debug('');
    System.debug('Recommended articles to create in Setup > Knowledge:');
    System.debug('');
    System.debug('1. "How to Reset Your Password"');
    System.debug('   - Go to login page, click Forgot Password');
    System.debug('   - Enter your email address');
    System.debug('   - Check your inbox for a reset link');
    System.debug('   - Link expires in 24 hours');
    System.debug('');
    System.debug('2. "Return and Exchange Policy"');
    System.debug('   - Items can be returned within 30 days of purchase');
    System.debug('   - Must have original receipt or order number');
    System.debug('   - Defective items qualify for free exchange');
    System.debug('   - Refunds processed within 5-7 business days');
    System.debug('');
    System.debug('3. "Shipping and Delivery Information"');
    System.debug('   - Standard shipping: 5-7 business days');
    System.debug('   - Express shipping: 2-3 business days');
    System.debug('   - Same-day delivery available in select cities');
    System.debug('   - Track your order at orders.example.com');
    System.debug('');
    System.debug('4. "Billing and Payment FAQ"');
    System.debug('   - We accept Visa, MasterCard, AmEx, PayPal');
    System.debug('   - Invoices are sent on the 1st of each month');
    System.debug('   - Payment terms: Net 30');
    System.debug('   - Contact billing@example.com for disputes');
    System.debug('');
    System.debug('5. "Service Level Agreement (SLA) Overview"');
    System.debug('   - Critical issues: 1-hour response time');
    System.debug('   - High priority: 4-hour response time');
    System.debug('   - Medium priority: 1 business day');
    System.debug('   - Low priority: 3 business days');
    System.debug('');
    System.debug('6. "How to Schedule a Reservation"');
    System.debug('   - Visit reservations.example.com or call 555-BOOK');
    System.debug('   - Available time slots: Mon-Fri 9AM-5PM');
    System.debug('   - Cancellation must be 24 hours in advance');
    System.debug('   - No-show policy: account may be charged');
    System.debug('');
    System.debug('7. "Escalation Process"');
    System.debug('   - Request escalation if issue not resolved in 48 hours');
    System.debug('   - Escalated cases are reviewed by a senior agent within 2 hours');
    System.debug('   - You can also request escalation by saying "speak to a manager"');
    System.debug('');
    System.debug('Create these in Setup > Knowledge > Articles, or enable Knowledge first if not already enabled.');

} catch (Exception e) {
    System.debug('Error: ' + e.getMessage());
    System.debug('Make sure Knowledge is enabled in Setup > Knowledge Settings');
}
