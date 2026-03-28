// ============================================
// SFAgent Tools - Sample Data for Agent Testing
// Run with: sf apex run --file scripts/seed-data.apex --target-org sfagent-dev
// ============================================

// --- Accounts ---
List<Account> accounts = new List<Account>{
    new Account(Name = 'Acme Corporation', Phone = '555-0100', Industry = 'Technology', BillingCity = 'San Francisco', BillingState = 'CA', BillingCountry = 'US'),
    new Account(Name = 'Global Logistics Inc', Phone = '555-0200', Industry = 'Transportation', BillingCity = 'Chicago', BillingState = 'IL', BillingCountry = 'US'),
    new Account(Name = 'Sunrise Health Systems', Phone = '555-0300', Industry = 'Healthcare', BillingCity = 'Boston', BillingState = 'MA', BillingCountry = 'US'),
    new Account(Name = 'Peak Performance Sports', Phone = '555-0400', Industry = 'Retail', BillingCity = 'Denver', BillingState = 'CO', BillingCountry = 'US'),
    new Account(Name = 'Evergreen Solutions', Phone = '555-0500', Industry = 'Consulting', BillingCity = 'Seattle', BillingState = 'WA', BillingCountry = 'US')
};
insert accounts;
System.debug('Inserted ' + accounts.size() + ' accounts');

// --- Contacts ---
List<Contact> contacts = new List<Contact>{
    new Contact(FirstName = 'Sarah', LastName = 'Johnson', Email = 'sarah.johnson@acme.com', Phone = '555-1001', AccountId = accounts[0].Id, Title = 'VP of Operations'),
    new Contact(FirstName = 'Michael', LastName = 'Chen', Email = 'michael.chen@acme.com', Phone = '555-1002', AccountId = accounts[0].Id, Title = 'IT Manager'),
    new Contact(FirstName = 'Emily', LastName = 'Rodriguez', Email = 'emily.rodriguez@globallogistics.com', Phone = '555-1003', AccountId = accounts[1].Id, Title = 'Logistics Director'),
    new Contact(FirstName = 'James', LastName = 'Wilson', Email = 'james.wilson@sunrisehealth.com', Phone = '555-1004', AccountId = accounts[2].Id, Title = 'Chief Medical Officer'),
    new Contact(FirstName = 'Lisa', LastName = 'Park', Email = 'lisa.park@peakperformance.com', Phone = '555-1005', AccountId = accounts[3].Id, Title = 'Store Manager'),
    new Contact(FirstName = 'David', LastName = 'Thompson', Email = 'david.thompson@evergreen.com', Phone = '555-1006', AccountId = accounts[4].Id, Title = 'Senior Consultant'),
    new Contact(FirstName = 'Maria', LastName = 'Garcia', Email = 'maria.garcia@acme.com', Phone = '555-1007', AccountId = accounts[0].Id, Title = 'Customer Success Manager'),
    new Contact(FirstName = 'Robert', LastName = 'Kim', Email = 'robert.kim@globallogistics.com', Phone = '555-1008', AccountId = accounts[1].Id, Title = 'Warehouse Supervisor')
};
insert contacts;
System.debug('Inserted ' + contacts.size() + ' contacts');

// --- Cases ---
List<Case> cases = new List<Case>{
    new Case(
        Subject = 'Software license not activating',
        Description = 'Customer purchased enterprise license but activation key returns error. Tried 3 times. Error code: LIC-4092.',
        Status = 'New',
        Priority = 'High',
        Origin = 'Web',
        ContactId = contacts[0].Id,
        AccountId = accounts[0].Id
    ),
    new Case(
        Subject = 'Billing discrepancy on invoice #INV-2024-0847',
        Description = 'Invoice shows $12,500 but contract states $10,000/month. Customer requesting credit for the overcharge.',
        Status = 'Working',
        Priority = 'Medium',
        Origin = 'Email',
        ContactId = contacts[1].Id,
        AccountId = accounts[0].Id
    ),
    new Case(
        Subject = 'Shipment delayed - Order #ORD-88291',
        Description = 'Package was supposed to arrive 3 days ago. Tracking shows stuck in transit at Memphis hub. Customer needs it for a trade show.',
        Status = 'New',
        Priority = 'High',
        Origin = 'Phone',
        ContactId = contacts[2].Id,
        AccountId = accounts[1].Id
    ),
    new Case(
        Subject = 'Unable to access patient portal',
        Description = 'Dr. Wilson cannot log into the patient management portal since the password reset last week. Gets "account locked" message.',
        Status = 'Escalated',
        Priority = 'Critical',
        Origin = 'Phone',
        ContactId = contacts[3].Id,
        AccountId = accounts[2].Id
    ),
    new Case(
        Subject = 'Return request for defective merchandise',
        Description = 'Customer received running shoes (SKU: SP-RUN-42B) with a manufacturing defect. Sole is detaching after 2 days of use. Wants exchange.',
        Status = 'New',
        Priority = 'Medium',
        Origin = 'Web',
        ContactId = contacts[4].Id,
        AccountId = accounts[3].Id
    ),
    new Case(
        Subject = 'Feature request: bulk export in reporting module',
        Description = 'Customer needs the ability to export more than 10,000 records at once from the analytics dashboard. Currently limited to 10K.',
        Status = 'New',
        Priority = 'Low',
        Origin = 'Email',
        ContactId = contacts[5].Id,
        AccountId = accounts[4].Id
    ),
    new Case(
        Subject = 'System outage affecting multiple users',
        Description = 'Since 9:00 AM EST, approximately 50 users at Acme Corp are experiencing intermittent 500 errors when accessing the platform.',
        Status = 'Working',
        Priority = 'Critical',
        Origin = 'Phone',
        ContactId = contacts[6].Id,
        AccountId = accounts[0].Id
    ),
    new Case(
        Subject = 'Delivery to wrong address',
        Description = 'Order #ORD-77432 delivered to 123 Main St instead of 456 Oak Ave. Customer needs redelivery ASAP. Contains perishable items.',
        Status = 'New',
        Priority = 'High',
        Origin = 'Chat',
        ContactId = contacts[7].Id,
        AccountId = accounts[1].Id
    )
};
insert cases;
System.debug('Inserted ' + cases.size() + ' cases');

// --- Orders ---
List<Order> orders = new List<Order>();
Pricebook2 standardPricebook = [SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1];

for (Integer i = 0; i < accounts.size(); i++) {
    orders.add(new Order(
        AccountId = accounts[i].Id,
        Status = 'Draft',
        EffectiveDate = Date.today().addDays(-i * 7),
        Pricebook2Id = standardPricebook.Id
    ));
}
insert orders;
System.debug('Inserted ' + orders.size() + ' orders');

System.debug('=== SAMPLE DATA SEEDING COMPLETE ===');
System.debug('Accounts: ' + accounts.size());
System.debug('Contacts: ' + contacts.size());
System.debug('Cases: ' + cases.size());
System.debug('Orders: ' + orders.size());
