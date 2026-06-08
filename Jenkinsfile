pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Branch allowed to deploy to staging')
        string(name: 'DEPLOY_HOST', defaultValue: 'root.flossk.org', description: 'SSH host for deployment (staging points to same server)')
        string(name: 'DEPLOY_USER', defaultValue: 'deploy', description: 'SSH username on deployment host')
        string(name: 'REMOTE_APP_DIR', defaultValue: '/opt/flossk', description: 'Absolute path of app repository on deployment host')
    }

    environment {
        STAGING_DOMAIN = 'staging.root.flossk.org'
        ROOT_DOMAIN = 'root.flossk.org'
        SSH_CREDENTIALS_ID = '0b1e52e8-4bd3-4e2c-a439-3e13cb19adba'
        DOTNET_CLI_TELEMETRY_OPTOUT = '1'
        DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('flossk-ms') {
                    sh '''
                        set -euxo pipefail
                        DOTNET_CMD="dotnet"
                        DOTNET_INFO_LOG="$WORKSPACE/dotnet-info.log"

                        if ! command -v dotnet >/dev/null 2>&1; then
                            echo "dotnet SDK not found on agent. Installing .NET 10 SDK locally in workspace..."
                            curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$WORKSPACE/dotnet-install.sh"
                            bash "$WORKSPACE/dotnet-install.sh" --channel 10.0 --install-dir "$WORKSPACE/.dotnet"
                            DOTNET_CMD="$WORKSPACE/.dotnet/dotnet"
                        fi

                        if ! "$DOTNET_CMD" --info >"$DOTNET_INFO_LOG" 2>&1; then
                            if grep -qi "Couldn't find a valid ICU package installed on the system" "$DOTNET_INFO_LOG"; then
                                echo "ICU libraries missing on Jenkins agent. Enabling invariant globalization mode for CI."
                                export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
                                "$DOTNET_CMD" --info
                            else
                                cat "$DOTNET_INFO_LOG"
                                exit 1
                            fi
                        fi

                        "$DOTNET_CMD" restore FlosskMS.slnx
                        "$DOTNET_CMD" test FlosskMS.slnx --configuration Release --no-restore --verbosity minimal
                    '''
                }
            }
        }

        stage('Deploy To Staging With Root Fallback') {
            when {
                allOf {
                    expression { env.BRANCH_NAME == params.DEPLOY_BRANCH }
                    not { changeRequest() }
                }
            }
            steps {
                sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                    sh '''
                        set -euxo pipefail

                        deploy_remote() {
                            target_domain="$1"
                            ssh -o StrictHostKeyChecking=accept-new "${DEPLOY_USER}@${DEPLOY_HOST}" "set -euxo pipefail; \
                                cd '${REMOTE_APP_DIR}'; \
                                git fetch --all --prune; \
                                git checkout '${DEPLOY_BRANCH}'; \
                                git pull --ff-only origin '${DEPLOY_BRANCH}'; \
                                DOMAIN='${target_domain}' docker compose -f docker-compose.prod.yml --env-file .env up -d --build; \
                                docker compose -f docker-compose.prod.yml ps"
                        }

                        staging_ok="false"
                        if deploy_remote "${STAGING_DOMAIN}"; then
                            if command -v curl >/dev/null 2>&1 && curl -fsSI "https://${STAGING_DOMAIN}/" --max-time 20 >/dev/null 2>&1; then
                                echo "Staging deployment and HTTPS check succeeded."
                                staging_ok="true"
                            else
                                echo "Staging deployment succeeded but HTTPS check failed. Falling back to root domain deployment."
                            fi
                        else
                            echo "Staging deployment command failed. Falling back to root domain deployment."
                        fi

                        if [ "$staging_ok" != "true" ]; then
                            deploy_remote "${ROOT_DOMAIN}"
                        fi
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully. Primary target: https://${env.STAGING_DOMAIN}. Fallback target: https://${env.ROOT_DOMAIN}."
        }
        failure {
            echo 'Pipeline failed. Deployment and fallback were unsuccessful or skipped.'
        }
    }
}