#!/bin/bash
cd /home/kavia/workspace/code-generation/githubuserdashboard-111205-6bc85665/github_user_dashboard
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

