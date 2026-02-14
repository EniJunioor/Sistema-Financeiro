# Root Cause Found
Element "R$ 35.600,20" exists at top:94, left:20, width:202, height:88
Color is white, fontSize 34px, overflow visible
But the gradient card is overlapping it visually (z-index issue)
The balanceCard has zIndex:2 but the element inside doesn't inherit it on web
Need to check the card's z-index and position
