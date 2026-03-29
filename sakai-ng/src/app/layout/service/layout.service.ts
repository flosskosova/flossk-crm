import { Injectable, effect, signal, computed, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthService } from '../../pages/service/auth.service';

export interface layoutConfig {
    preset?: string;
    primary?: string;
    surface?: string | undefined | null;
    darkTheme?: boolean;
    menuMode?: string;
}

interface LayoutState {
    staticMenuDesktopInactive?: boolean;
    overlayMenuActive?: boolean;
    configSidebarVisible?: boolean;
    staticMenuMobileActive?: boolean;
    menuHoverActive?: boolean;
}

interface MenuChangeEvent {
    key: string;
    routeEvent?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    _config: layoutConfig = {
        preset: 'Aura',
        primary: 'flossk',
        surface: null,
        darkTheme: false,
        menuMode: 'static'
    };

    _state: LayoutState = {
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    };

    layoutConfig = signal<layoutConfig>(this._config);

    layoutState = signal<LayoutState>(this._state);

    private configUpdate = new Subject<layoutConfig>();

    private overlayOpen = new Subject<any>();

    private menuSource = new Subject<MenuChangeEvent>();

    private resetSource = new Subject();

    menuSource$ = this.menuSource.asObservable();

    resetSource$ = this.resetSource.asObservable();

    configUpdate$ = this.configUpdate.asObservable();

    overlayOpen$ = this.overlayOpen.asObservable();

    theme = computed(() => (this.layoutConfig()?.darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().staticMenuMobileActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;
    private themeInitialized = false;
    private authService = inject(AuthService);

    constructor() {
        // Read saved layout preferences from localStorage
        const storedPrimary = localStorage.getItem('layout_primary');
        const storedSurface = localStorage.getItem('layout_surface');
        const storedPreset = localStorage.getItem('layout_preset');

        // Initialize theme from localStorage or user preference
        const initialTheme = this.authService.getThemePreference();
        this.layoutConfig.update((config) => ({
            ...config,
            darkTheme: initialTheme,
            ...(storedPrimary ? { primary: storedPrimary } : {}),
            ...(storedSurface != null ? { surface: storedSurface } : {}),
            ...(storedPreset ? { preset: storedPreset } : {}),
        }));
        
        // Apply theme immediately to DOM to prevent flash
        this.toggleDarkMode({ ...this.layoutConfig(), darkTheme: initialTheme });

        effect(() => {
            const config = this.layoutConfig();
            if (config) {
                this.onConfigUpdate();
            }
        });

        // Persist primary, surface, preset to localStorage whenever they change
        effect(() => {
            const config = this.layoutConfig();
            if (config.primary) localStorage.setItem('layout_primary', config.primary);
            if (config.surface != null) localStorage.setItem('layout_surface', config.surface);
            else localStorage.removeItem('layout_surface');
            if (config.preset) localStorage.setItem('layout_preset', config.preset);
        });

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
        });

        // Sync dark mode with user's preference from backend
        effect(() => {
            const user = this.authService.currentUser();
            if (user && !this.themeInitialized) {
                this.themeInitialized = true;
                const darkTheme = user.darkTheme ?? false;
                if (darkTheme !== this.layoutConfig().darkTheme) {
                    this.layoutConfig.update((config) => ({ ...config, darkTheme }));
                }
            } else if (!user && this.themeInitialized) {
                // When user logs out, load theme from localStorage
                this.themeInitialized = false;
                const storedTheme = this.authService.getThemePreference();
                if (storedTheme !== this.layoutConfig().darkTheme) {
                    this.layoutConfig.update((config) => ({ ...config, darkTheme: storedTheme }));
                }
            }
        });
    }

    private handleDarkModeTransition(config: layoutConfig): void {
        if ((document as any).startViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
            this.onTransitionEnd();
        }
    }

    private startViewTransition(config: layoutConfig): void {
        const transition = (document as any).startViewTransition(() => {
            this.toggleDarkMode(config);
        });

        transition.ready
            .then(() => {
                this.onTransitionEnd();
            })
            .catch(() => {});
    }

    toggleDarkMode(config?: layoutConfig): void {
        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    toggleAndPersistDarkMode(): void {
        const newDarkTheme = !this.layoutConfig().darkTheme;
        this.layoutConfig.update((config) => ({ ...config, darkTheme: newDarkTheme }));
        
        // Persist to backend if user is authenticated, otherwise just save locally
        if (this.authService.isAuthenticated()) {
            this.authService.updateThemePreference(newDarkTheme).subscribe({
                error: (err) => console.error('Failed to save theme preference:', err)
            });
        } else {
            // Save to localStorage for non-authenticated users
            this.authService.saveThemeLocally(newDarkTheme);
        }
    }

    private onTransitionEnd() {
        this.transitionComplete.set(true);
        setTimeout(() => {
            this.transitionComplete.set(false);
        });
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));

            if (this.layoutState().overlayMenuActive) {
                this.overlayOpen.next(null);
            }
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, staticMenuMobileActive: !this.layoutState().staticMenuMobileActive }));

            if (this.layoutState().staticMenuMobileActive) {
                this.overlayOpen.next(null);
            }
        }
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }

    onConfigUpdate() {
        this._config = { ...this.layoutConfig() };
        this.configUpdate.next(this.layoutConfig());
    }

    onMenuStateChange(event: MenuChangeEvent) {
        this.menuSource.next(event);
    }

    reset() {
        this.resetSource.next(true);
    }
}
