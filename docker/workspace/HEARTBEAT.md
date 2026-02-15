# Heartbeat Checklist

Check these every cycle. Only message user if something needs attention.

## Time-Based Actions (check current time)
- [ ] Morning briefing (8:00-8:30 AM): If not sent today, generate briefing with overdue tasks, today's deadlines, yesterday's calorie total vs goal, pending expenses. Keep under 150 words.
- [ ] Weekly nutrition summary (Sunday 8:00-8:30 PM): If not sent this week, generate weekly summary with avg daily calories, days goal was hit, meal logging consistency.
- [ ] Monthly expense summary (1st of month, 9:00-9:30 AM): If not sent this month, generate expense breakdown by category, total, comparison to last month.

## Tasks & Reminders
- [ ] Any tasks overdue by more than 1 day?
- [ ] Any deadlines within the next 24 hours?
- [ ] Any follow-ups promised that haven't been done?
- [ ] Check reminders table: trigger_at <= now() AND status = 'active'

## Nutrition
- [ ] Is it after 2pm and lunch hasn't been logged?
- [ ] Is it after 9pm and dinner hasn't been logged?
- [ ] Has the user exceeded their daily calorie goal?

## Expenses
- [ ] Any recurring expenses due today?
- [ ] Any unusual spending flagged?

## General
- [ ] Any pending items from yesterday's conversation?

If nothing needs attention, respond with HEARTBEAT_OK.
