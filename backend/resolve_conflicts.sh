#!/bin/bash

# Simple Merge Conflict Resolution Script
# This will resolve conflicts by keeping YOUR branch changes (Joshua_256)

echo "Starting merge conflict resolution..."
echo ""

# Step 1: Set up rebase
echo "Step 1: Configuring git to use rebase..."
git config pull.rebase true

# Step 2: Try to pull with rebase
echo "Step 2: Pulling master with rebase..."
git pull origin master --rebase

# Check if there are conflicts
if [ $? -ne 0 ]; then
    echo ""
    echo "Conflicts detected. Resolving automatically..."
    echo ""
    
    # For each conflicted file, use 'ours' strategy (keep your changes)
    echo "Resolving backend/accounts/views.py..."
    git checkout --ours backend/accounts/views.py
    git add backend/accounts/views.py
    
    echo "Resolving backend/catalog/views.py..."
    git checkout --ours backend/catalog/views.py
    git add backend/catalog/views.py
    
    echo "Resolving backend/elibrary/urls.py..."
    git checkout --ours backend/elibrary/urls.py
    git add backend/elibrary/urls.py
    
    echo "Resolving backend/reading/views.py..."
    git checkout --ours backend/reading/views.py
    git add backend/reading/views.py
    
    echo ""
    echo "All conflicts resolved. Continuing rebase..."
    git rebase --continue
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Rebase successful!"
        echo "Now push with: git push origin Joshua_256 --force-with-lease"
    else
        echo ""
        echo "⚠️  Additional conflicts may exist. Check git status."
    fi
else
    echo "✅ No conflicts! Pull successful."
fi
