import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService, getInitials, isDefaultAvatar } from '@/pages/service/auth.service';
import { ProjectsService } from '@/pages/service/projects.service';
import { InventoryService, InventoryItem } from '@/pages/service/inventory.service';
import { ProfileService, User } from '@/pages/service/profile.service';
import { PresenceService } from '@/pages/service/presence.service';
import { UserStatusIndicator } from './user-status-indicator';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment.prod';

@Component({
    selector: 'app-profile',
    imports: [CommonModule, FormsModule, AvatarModule, ButtonModule, TagModule, ChipModule, BadgeModule, DividerModule, PanelModule, ProgressBarModule, AvatarGroupModule, DialogModule, InputTextModule, InputNumberModule, TextareaModule, FileUploadModule, SelectModule, SkeletonModule, ConfirmDialogModule, ToastModule, UserStatusIndicator],
    providers: [ConfirmationService],
    template: `
        <p-confirmdialog></p-confirmdialog>
        <!-- Profile Header Loading Skeleton -->
        <div *ngIf="isProfileLoading" class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <div class="flex flex-col lg:flex-row gap-8">
                        <div class="flex flex-col items-center">
                            <p-skeleton shape="circle" size="18rem" styleClass="mb-4"></p-skeleton>
                        </div>
                        <div class="flex-1">
                            <p-skeleton width="60%" height="2rem" styleClass="mb-4"></p-skeleton>
                            <p-skeleton width="40%" styleClass="mb-4"></p-skeleton>
                            <div class="flex gap-2 mb-4">
                                <p-skeleton width="5rem" height="2.5rem"></p-skeleton>
                                <p-skeleton width="5rem" height="2.5rem"></p-skeleton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-12">
                <div class="grid grid-cols-12 gap-8">
                    <div *ngFor="let i of [1,2,3,4]" class="col-span-12 md:col-span-6 lg:col-span-3">
                        <div class="card h-full">
                            <p-skeleton width="50%" height="1.5rem" styleClass="mb-4"></p-skeleton>
                            <p-skeleton width="100%" height="4rem"></p-skeleton>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <ng-container *ngIf="!isProfileLoading">
        <p-dialog [(visible)]="editDialogVisible" header="Edit Profile" [modal]="true" [style]="{width: '70rem'}" [contentStyle]="{'overflow-y': 'auto'}" appendTo="body" [maximizable]="true">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Column 1: Profile Picture -->
                <div class="flex flex-col gap-4">
                    <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">Profile Picture</h4>
                    <div class="flex flex-col gap-4">
                        <img 
                            *ngIf="hasProfilePicture(editProfile.picture)"
                            [src]="editProfile.picture" 
                            alt="Profile Picture"
                            class="w-70 h-70 object-cover rounded-full border-4 border-surface-200 dark:border-surface-700"
                        >
                        <p-avatar
                            *ngIf="!hasProfilePicture(editProfile.picture)"
                            [label]="getInitials(editProfile.firstName + ' ' + editProfile.lastName)"
                            shape="circle"
                            size="xlarge"
                            [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)', 'width': '17.5rem', 'height': '17.5rem', 'font-size': '5rem'}"
                            class="border-4 border-surface-200 dark:border-surface-700"
                        ></p-avatar>
                        <div class="flex gap-2 w-full">
                            <p-fileupload 
                                mode="basic" 
                                chooseLabel="Change" 
                                accept="image/*"
                                [maxFileSize]="1000000"
                                (onSelect)="onFileSelect($event)"
                                [auto]="true"
                            ></p-fileupload>
                            <p-button 
                                icon="pi pi-trash" 
                                label="Delete"
                                severity="danger" 
                                [outlined]="true"
                                (onClick)="deleteProfilePicture()"
                            ></p-button>
                        </div>
                    </div>
                </div>
                
                <!-- Column 2: Biography, Phone, Location, Skills -->
                <div class="flex flex-col gap-4">
                    <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">Personal Information</h4>
                    
                    <div>
                        <label for="biography" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Biography</label>
                        <textarea pInputTextarea id="biography" [(ngModel)]="editProfile.biography" [rows]="10" class="w-full"></textarea>
                    </div>
                    
                    <div>
                        <label for="phone" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Phone</label>
                        <input pInputText id="phone" [(ngModel)]="editProfile.phone" class="w-full" />
                    </div>
                    
                    <div>
                        <label for="location" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Location</label>
                        <p-select
                            id="location"
                            [(ngModel)]="editProfile.location"
                            [options]="kosovoCities"
                            placeholder="Select a city"
                            [showClear]="true"
                            styleClass="w-full"
                        />
                    </div>

                    <div>
                        <label for="skills" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">Skills (comma-separated)</label>
                        <input pInputText id="skills" [(ngModel)]="skillsString" placeholder="e.g. Angular, TypeScript, Python" class="w-full" />
                    </div>
                </div>
                
                <!-- Column 3: Social Links -->
                <div class="flex flex-col gap-4">
                    <h4 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">Social Links</h4>
                    
                    <div>
                        <label for="github" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                            <i class="pi pi-github mr-2"></i>GitHub
                        </label>
                        <input pInputText id="github" [(ngModel)]="editProfile.socialLinks.github" placeholder="https://github.com/username" class="w-full" />
                    </div>
                    
                    <div>
                        <label for="linkedin" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                            <i class="pi pi-linkedin mr-2"></i>LinkedIn
                        </label>
                        <input pInputText id="linkedin" [(ngModel)]="editProfile.socialLinks.linkedin" placeholder="https://linkedin.com/in/username" class="w-full" />
                    </div>
                    
                    <div>
                        <label for="twitter" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                            <i class="pi pi-twitter mr-2"></i>X (Twitter)
                        </label>
                        <input pInputText id="twitter" [(ngModel)]="editProfile.socialLinks.twitter" placeholder="https://x.com/username" class="w-full" />
                    </div>
                    
                    <div>
                        <label for="steam" class="flex text-surface-900 dark:text-surface-0 font-medium mb-2">
                            <i class="pi pi-steam mr-2" style="font-size: 1.25rem"></i>Steam
                        </label>
                        <input pInputText id="steam" [(ngModel)]="editProfile.socialLinks.steam" placeholder="https://steamcommunity.com/id/username" class="w-full" />
                    </div>

                    <div>
                        <label for="instagram" class="flex text-surface-900 dark:text-surface-0 font-medium mb-2">
                            <i class="pi pi-instagram mr-2" style="font-size: 1.25rem"></i>Instagram
                        </label>
                        <input pInputText id="instagram" [(ngModel)]="editProfile.socialLinks.instagram" placeholder="https://instagram.com/username" class="w-full" />
                    </div>
                    
                    <div>
                        <label for="youtube" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                            <i class="pi pi-youtube mr-2"></i>YouTube
                        </label>
                        <input pInputText id="youtube" [(ngModel)]="editProfile.socialLinks.youtube" placeholder="https://youtube.com/@username" class="w-full" />
                    </div>

                    <div>
                        <label for="spotify" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                            <i class="pi pi-spotify mr-2"></i>Spotify
                        </label>
                        <input pInputText id="spotify" [(ngModel)]="editProfile.socialLinks.spotify" placeholder="https://open.spotify.com/user/username" class="w-full" />
                    </div>
                    
                    <div>
                        <label for="website" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                            <i class="pi pi-link mr-2"></i>Personal Website
                        </label>
                        <input pInputText id="website" [(ngModel)]="editProfile.website" placeholder="https://yourwebsite.com" class="w-full" />
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <p-button label="Cancel" severity="secondary" (onClick)="editDialogVisible = false" />
                <p-button label="Save Changes" (onClick)="saveProfile()" />
            </div>
        </p-dialog>
        
        <div class="grid grid-cols-12 gap-8">
            <!-- Profile Header Card -->
            <div class="col-span-12">
                <div class="card !p-0 overflow-hidden">
                    <!-- Banner -->
                    <div class="relative h-72 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-700 overflow-hidden group">
                        <img
                            *ngIf="userProfile.bannerUrl"
                            [src]="userProfile.bannerUrl"
                            alt="Profile banner"
                            class="w-full h-full object-cover"
                        />
                        <!-- Change banner button (own profile) -->
                        <div *ngIf="isOwnProfile" class="absolute bottom-4 right-4 flex flex-col md:flex-row gap-2 items-end">
                            <p-fileupload
                                mode="basic"
                                chooseIcon="pi pi-camera"
                                chooseLabel="Change"
                                accept="image/*"
                                [maxFileSize]="5000000"
                                (onSelect)="onBannerSelect($event)"
                                [auto]="true"
                                styleClass="!text-white !border-0"
                            />
                            <button
                                *ngIf="userProfile.bannerUrl"
                                (click)="deleteBanner()"
                                class="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-black/50 text-white border-0 hover:bg-red-600/80 backdrop-blur-sm transition-all cursor-pointer"
                            >
                                <i class="pi pi-trash text-xs"></i>
                                Remove
                            </button>
                        </div>
                    </div>
                    <!-- Profile content -->
                    <div class="px-6 pb-6">
                        <div class="flex flex-col lg:flex-row gap-6">
                            <!-- Avatar overlapping banner -->
                            <div class="-mt-28 flex-shrink-0">
                                <div class="relative inline-block">
                                    <img
                                        *ngIf="hasProfilePicture(userProfile.picture)"
                                        [src]="userProfile.picture"
                                        [alt]="userProfile.firstName + ' ' + userProfile.lastName"
                                        class="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-cover rounded-full border-4 border-surface-0 dark:border-surface-900 shadow-lg"
                                    >
                                    <p-avatar
                                        *ngIf="!hasProfilePicture(userProfile.picture)"
                                        [label]="getInitials(userProfile.firstName + ' ' + userProfile.lastName)"
                                        shape="circle"
                                        size="xlarge"
                                        [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)', 'width': '16rem', 'height': '16rem', 'font-size': '5rem'}"
                                        class="border-4 border-surface-0 dark:border-surface-900 shadow-lg"
                                    />
                                    <user-status-indicator
                                        *ngIf="profileUserId"
                                        [userId]="profileUserId"
                                        size="xl"
                                        class="absolute bottom-4 right-4"
                                    />
                                </div>
                            </div>
                            <!-- Profile Information -->
                            <div class="flex-1 pt-3">
                                <div class="flex flex-col gap-4">
                                    <div class="flex flex-col gap-1">
                                        <h2 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
                                            {{ userProfile.firstName }} {{ userProfile.lastName }}
                                        </h2>
                                        <p class="text-muted-color flex items-center gap-2">
                                            <i class="pi pi-envelope text-sm"></i>
                                             {{ userProfile.email }}
                                        </p>
                                     
                                        <p *ngIf="userProfile.phone" class="text-muted-color flex items-center gap-2">
                                            <i class="pi pi-phone text-sm"></i>
                                            {{ userProfile.phone }}
                                        </p>
                                        <p *ngIf="userProfile.location" class="text-muted-color flex items-center gap-2">
                                            <i class="pi pi-map-marker text-sm"></i>
                                            {{ userProfile.location }}
                                        </p>
                                    </div>

                                    <div class="flex gap-3">
                                        <a *ngIf="userProfile.socialLinks.github" [href]="userProfile.socialLinks.github" target="_blank" class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors">
                                            <i class="pi pi-github" style="font-size: 1.25rem"></i>
                                        </a>
                                        <a *ngIf="userProfile.socialLinks.linkedin" [href]="userProfile.socialLinks.linkedin" target="_blank" class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors">
                                            <i class="pi pi-linkedin" style="font-size: 1.25rem"></i>
                                        </a>
                                        <a *ngIf="userProfile.socialLinks.twitter" [href]="userProfile.socialLinks.twitter" target="_blank" class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors">
                                            <i class="pi pi-twitter" style="font-size: 1.25rem"></i>
                                        </a>
                                        <a *ngIf="userProfile.socialLinks.youtube" [href]="userProfile.socialLinks.youtube" target="_blank" class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors">
                                            <i class="pi pi-youtube" style="font-size: 1.25rem"></i>
                                        </a>
                                        <a *ngIf="userProfile.socialLinks.steam" [href]="userProfile.socialLinks.steam" target="_blank" class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors">
                                            <i class="pi-steam" style="font-size: 1.25rem"></i>
                                        </a>
                                        <a *ngIf="userProfile.socialLinks.instagram" [href]="userProfile.socialLinks.instagram" target="_blank" class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors">
                                            <i class="pi pi-instagram" style="font-size: 1.25rem"></i>
                                        </a>
                                        <a *ngIf="userProfile.socialLinks.spotify" [href]="userProfile.socialLinks.spotify" target="_blank" class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors">
                                            <i class="pi pi-spotify" style="font-size: 1.25rem"></i>
                                        </a>
                                        <a *ngIf="userProfile.website" [href]="userProfile.website" target="_blank" class="text-surface-600 dark:text-surface-400 hover:text-primary transition-colors">
                                            <i class="pi pi-link" style="font-size: 1.25rem"></i>
                                        </a>
                                    </div>
                                
                                    <div class="flex flex-wrap gap-4">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-calendar text-muted-color"></i>
                                            <span class="text-muted-color">Joined: </span>
                                            <span class="font-semibold">{{ userProfile.dateJoined }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-briefcase text-muted-color"></i>
                                            <span class="text-muted-color">Role: </span>
                                            <span class="font-semibold">{{ userProfile.role }}</span>
                                        </div>
                                        <div class="flex items-center gap-2" *ngIf="profileUserId">
                                            <i class="pi pi-clock text-muted-color"></i>
                                            <span class="text-muted-color">Last Active: </span>
                                            <span class="font-semibold" [ngClass]="{
                                                'text-green-500': getPresenceStatus() === 'Online',
                                                'text-yellow-500': getPresenceStatus() === 'Idle'
                                            }">{{ getLastActiveText() }}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="flex gap-2" *ngIf="isOwnProfile">
                                        <p-button label="Edit" icon="pi pi-pencil" outlined (onClick)="openEditDialog()"></p-button>
                                        <p-button label="Reset Password" icon="pi pi-lock" [loading]="resettingPassword" (onClick)="onForgotPassword()"></p-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Information Cards Section -->
            <div class="col-span-12">
                <div class="grid grid-cols-12 gap-6">
                    <!-- Biography Card -->
                    <div class="col-span-12 lg:col-span-8">
                        <div class="card mb-6">
                            <div class="flex items-center gap-3 mb-4">
                                <i style="font-size: 1.5rem;" class="pi pi-user text-primary text-xl"></i>
                                <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">About</h3>
                            </div>
                            <p class="text-surface-700 dark:text-surface-300 leading-relaxed m-0 text-lg">
                                {{ userProfile.biography || 'No biography provided yet.' }}
                            </p>
                        </div>
                        
                        <!-- Projects Card -->
                        <div class="card">
                            <div class="flex items-center gap-3 mb-6">
                                <i style="font-size: 1.5rem;" class="pi pi-hammer text-primary text-xl"></i>
                                <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0"> {{ userProfile.firstName }}'s Projects</h3>
                            </div>
                            
                            <!-- Projects Skeleton -->
                            <div *ngIf="isProjectsLoading" class="flex flex-col gap-4">
                                <div *ngFor="let i of [1,2]" class="border border-surface-200 dark:border-surface-700 rounded-border p-4">
                                    <div class="flex justify-between items-start mb-3">
                                        <div class="flex-1">
                                            <p-skeleton width="40%" height="1.5rem" styleClass="mb-2"></p-skeleton>
                                            <p-skeleton width="20%" height="1rem"></p-skeleton>
                                        </div>
                                        <p-skeleton width="5rem" height="1.5rem"></p-skeleton>
                                    </div>
                                    <p-skeleton width="100%" height="2rem" styleClass="mb-4"></p-skeleton>
                                    <p-skeleton width="60%" height="1rem"></p-skeleton>
                                </div>
                            </div>

                            <div *ngIf="!isProjectsLoading" class="flex flex-col gap-4">
                                <div *ngFor="let project of userProjects" class="border border-surface-200 dark:border-surface-700 rounded-border p-4 hover:shadow-md transition-shadow">
                                    <div class="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-2">{{ project.name }}</h4>
                                            <div class="flex items-center gap-2 text-sm text-muted-color mb-2">
                                                <i class="pi pi-user"></i>
                                                <span>{{ project.role }}</span>
                                            </div>
                                        </div>
                                        <p-tag 
                                            [value]="project.status" 
                                            [severity]="getStatusSeverity(project.status)"
                                        ></p-tag>
                                    </div>
                                    
                                    <p class="text-surface-700 dark:text-surface-300 mb-4">
                                        {{ project.description }}
                                    </p>
                                    
                                    <div class="mb-4" *ngIf="project.status === 'in-progress'">
                                        <div class="flex justify-between text-sm mb-2">
                                            <span class="text-muted-color">Progress</span>
                                            <span class="font-semibold">{{ project.progress }}%</span>
                                        </div>
                                        <p-progressbar [value]="project.progress" [showValue]="false"></p-progressbar>
                                    </div>
                                    
                                    <div class="flex items-center justify-between pt-3 border-t border-surface-200 dark:border-surface-700">
                                        <div>
                                            <p class="text-xs text-muted-color mb-2">Team Members</p>
                                            <p-avatargroup>
                                                <p-avatar 
                                                    *ngFor="let member of project.team.slice(0, 3)" 
                                                    [image]="hasProfilePicture(member.avatar) ? member.avatar : undefined"
                                                    [label]="!hasProfilePicture(member.avatar) ? getInitials(member.name) : undefined"
                                                    shape="circle"
                                                    size="normal"
                                                    [style]="!hasProfilePicture(member.avatar) ? {'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'} : {}"
                                                ></p-avatar>
                                                <p-avatar 
                                                    *ngIf="project.team.length > 3"
                                                    [label]="'+' + (project.team.length - 3)" 
                                                    shape="circle"
                                                    size="normal"
                                                    [style]="{'background-color': 'var(--primary-color)', 'color': 'var(--primary-color-text)'}"
                                                ></p-avatar>
                                            </p-avatargroup>
                                        </div>
                                    </div>
                                </div>
                                
                                <div *ngIf="!userProjects || userProjects.length === 0" class="text-center py-8 text-muted-color">
                                    <i class="pi pi-inbox text-6xl mb-4"></i>
                                    <p class="text-lg">No projects yet</p>
                                </div>
                            </div>
                        </div>

                        <!-- Certificates Card -->
                        <div class="card mt-6">
                            <div class="flex items-center gap-3 mb-6">
                                <i style="font-size: 1.5rem;" class="pi pi-verified text-primary text-xl"></i>
                                <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">{{ isOwnProfile ? 'My Certificates' : userProfile.firstName + "'s Certificates" }}</h3>
                            </div>

                            <!-- Certificates Skeleton -->
                            <div *ngIf="isCertificatesLoading" class="flex flex-col gap-4">
                                <div *ngFor="let i of [1,2]" class="border border-surface-200 dark:border-surface-700 rounded-border p-4">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="flex-1">
                                            <p-skeleton width="50%" height="1.5rem" styleClass="mb-2"></p-skeleton>
                                            <p-skeleton width="70%" height="1rem"></p-skeleton>
                                        </div>
                                        <p-skeleton width="4rem" height="1.5rem"></p-skeleton>
                                    </div>
                                    <div class="flex gap-4 mt-3">
                                        <p-skeleton width="6rem" height="1rem"></p-skeleton>
                                        <p-skeleton width="8rem" height="1rem"></p-skeleton>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="!isCertificatesLoading" class="flex flex-col gap-4">
                                <div *ngFor="let cert of userCertificates" class="border border-surface-200 dark:border-surface-700 rounded-border p-4 hover:shadow-md transition-shadow">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="flex-1">
                                            <h4 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-1">{{ cert.eventName }}</h4>
                                            <p *ngIf="cert.description" class="text-surface-700 dark:text-surface-300 text-sm mb-2">{{ cert.description }}</p>
                                        </div>
                                        <p-tag 
                                            [value]="cert.status" 
                                            [severity]="cert.status === 'Issued' ? 'success' : cert.status === 'Revoked' ? 'danger' : 'warn'"
                                        ></p-tag>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-4 text-sm text-muted-color">
                                        <span class="flex items-center gap-1">
                                            <i class="pi pi-calendar"></i>
                                            {{ cert.issuedDate | date:'MMM d, y' }}
                                        </span>
                                        <span class="flex items-center gap-1">
                                            <i class="pi pi-user"></i>
                                            Issued by {{ cert.issuedByName }}
                                        </span>
                                    </div>
                                    <div class="flex gap-2 mt-3">
                                        <p-button 
                                            icon="pi pi-eye" 
                                            label="View" 
                                            size="small" 
                                            [outlined]="true"
                                            (onClick)="viewCertificateImage(cert)"
                                        ></p-button>
                                        <p-button 
                                            icon="pi pi-download" 
                                            label="Download" 
                                            size="small" 
                                            severity="secondary"
                                            [outlined]="true"
                                            (onClick)="downloadCertificate(cert)"
                                        ></p-button>
                                    </div>
                                </div>

                                <div *ngIf="!userCertificates || userCertificates.length === 0" class="text-center py-8 text-muted-color">
                                    <i class="pi pi-verified text-6xl mb-4"></i>
                                    <p class="text-lg">No certificates yet</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Sidebar -->
                    <div class="col-span-12 lg:col-span-4">
                        <!-- Skills Card -->
                        <div class="card mb-6">
                            <div class="flex items-center gap-3 mb-4">
                                <i style="font-size: 1.5rem;" class="pi pi-star text-primary text-xl"></i>
                                <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">Skills & Expertise</h3>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                <p-chip 
                                    *ngFor="let skill of userProfile.skills" 
                                    [label]="skill"
                                    styleClass="bg-primary-100 dark:bg-primary-400/10 text-primary-700 dark:text-primary-400"
                                ></p-chip>
                                <span *ngIf="!userProfile.skills || userProfile.skills.length === 0" class="text-surface-700 dark:text-surface-300">No skills added yet</span>
                            </div>
                        </div>
                        
                        <!-- Statistics Card -->
                        <div class="card">
                            <div class="flex items-center gap-3 mb-4">
                                <i style="font-size: 1.5rem;" class="pi pi-chart-bar text-primary text-xl"></i>
                                <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">Statistics</h3>
                            </div>
                            <div class="flex flex-col gap-6">
                                <div class="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-border">
                                    <div>
                                        <div class="text-muted-color text-sm mb-1">Projects</div>
                                        <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">24</div>
                                    </div>
                                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 3.5rem; height: 3.5rem">
                                        <i style="font-size: 1.5rem;" class="pi pi-folder text-blue-500 text-2xl"></i>
                                    </div>
                                </div>

                                <div class="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-border">
                                    <div>
                                        <div class="text-muted-color text-sm mb-1">Contributions</div>
                                        <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">156</div>
                                    </div>
                                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 3.5rem; height: 3.5rem">
                                        <i style="font-size: 1.5rem;" class="pi pi-code text-green-500 text-2xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- CV Card -->
                        <div class="card mt-6">
                            <div class="flex items-center gap-3 mb-4">
                                <i style="font-size: 1.5rem;" class="pi pi-file-pdf text-primary text-xl"></i>
                                <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">CV / Resume</h3>
                            </div>
                            <div class="flex flex-col gap-3">
                                <div *ngIf="userProfile.cvUrl" class="flex flex-col gap-2">
                                    <a [href]="userProfile.cvUrl" target="_blank" class="flex-1">
                                        <p-button label="View CV" icon="pi pi-external-link" styleClass="w-full" [outlined]="true"></p-button>
                                    </a>
                                    <p-button label="Download" icon="pi pi-download" styleClass="w-full flex-1" (onClick)="downloadCV()"></p-button>
                                </div>
                                <div *ngIf="!userProfile.cvUrl" class="text-center py-4 text-surface-500">
                                    <i class="pi pi-file-pdf text-4xl mb-2"></i>
                                    <p>No CV uploaded yet</p>
                                </div>
                                <div *ngIf="isOwnProfile" class="flex items-center justify-between">
                                    <p-fileupload 
                                        mode="basic" 
                                        [chooseLabel]="userProfile.cvUrl ? 'Replace CV' : 'Upload CV'"
                                        accept=".pdf"
                                        [maxFileSize]="5000000"
                                        (onSelect)="onCVSelect($event)"
                                        [auto]="true"
                                        styleClass="w-full"
                                    ></p-fileupload>
                                    <p-button 
                                        *ngIf="userProfile.cvUrl"
                                        label="Delete CV" 
                                        icon="pi pi-trash" 
                                        severity="danger" 
                                        [outlined]="true"
                                        styleClass="w-full"
                                        (onClick)="deleteCV()"
                                    ></p-button>
                                </div>
                            </div>
                        </div>

        <!-- Profile Checkin Dialog -->
        <p-dialog
            [(visible)]="profileCheckinDialogVisible"
            header="Check In Item"
            [modal]="true"
            [style]="{ width: '30rem' }"
            [breakpoints]="{ '575px': '95vw' }"
            appendTo="body"
        >
            <div class="flex flex-col gap-4">
                <p class="text-sm text-muted-color mb-2">
                    How many units of <strong>{{ profileCheckinItem?.name }}</strong> would you like to check in?
                </p>
                <div class="flex flex-col gap-2">
                    <label for="profileCheckinQuantity" class="font-semibold">Quantity</label>
                    <p-inputNumber
                        id="profileCheckinQuantity"
                        [(ngModel)]="profileCheckinQuantity"
                        [min]="1"
                        [max]="profileCheckinMaxQuantity"
                        [showButtons]="true"
                        [useGrouping]="false"
                        buttonLayout="horizontal"
                        incrementButtonIcon="pi pi-plus"
                        decrementButtonIcon="pi pi-minus"
                        inputmode="numeric"
                        class="w-full"
                    />
                    <small class="text-muted-color">
                        Checked out by you: {{ profileCheckinMaxQuantity }} unit{{ profileCheckinMaxQuantity !== 1 ? 's' : '' }}
                    </small>
                </div>
            </div>
            <ng-template #footer>
                <div class="flex justify-end gap-2 mt-4">
                    <p-button
                        label="Cancel"
                        severity="secondary"
                        (onClick)="profileCheckinDialogVisible = false"
                    />
                    <p-button
                        label="Check In"
                        severity="success"
                        (onClick)="submitProfileCheckin()"
                    />
                </div>
            </ng-template>
        </p-dialog>

                        <!-- Checked Out Items Card -->
                        <div class="card mt-6">
                            <div class="flex items-center gap-3 mb-4">
                                <i style="font-size: 1.5rem;" class="pi pi-box text-primary text-xl"></i>
                                <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">
                                    <ng-container *ngIf="isOwnProfile">Checked Out Items</ng-container>
                                    <ng-container *ngIf="!isOwnProfile">{{ userProfile.firstName }}'s Checked Out Items</ng-container>
                                </h3>
                            </div>
                            <!-- Checked Out Items Skeleton -->
                            <div *ngIf="isItemsLoading" class="flex flex-col gap-3">
                                <div *ngFor="let i of [1,2]" class="border border-surface-200 dark:border-surface-700 rounded-border p-3">
                                    <div class="flex items-start gap-3">
                                        <p-skeleton width="4rem" height="4rem" styleClass="rounded-border"></p-skeleton>
                                        <div class="flex-1">
                                            <p-skeleton width="40%" height="1rem" styleClass="mb-2"></p-skeleton>
                                            <p-skeleton width="60%" height="0.75rem" styleClass="mb-2"></p-skeleton>
                                            <p-skeleton width="30%" height="0.75rem"></p-skeleton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div *ngIf="!isItemsLoading" class="flex flex-col gap-3">
                                <div *ngIf="checkedOutItems && checkedOutItems.length > 0" class="flex flex-col gap-3">
                                    <div *ngFor="let item of checkedOutItems" class="border border-surface-200 dark:border-surface-700 rounded-border p-3">
                                        <div class="flex items-start gap-3">
                                            <img 
                                                *ngIf="item.thumbnailPath || (item.images && item.images.length > 0)" 
                                                [src]="getInventoryItemImageUrl(item)" 
                                                [alt]="item.name" 
                                                class="w-16 h-16 object-cover rounded-border"
                                            />
                                            <div *ngIf="!item.thumbnailPath && (!item.images || item.images.length === 0)" class="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-border flex items-center justify-center">
                                                <i class="pi pi-box text-2xl text-surface-400"></i>
                                            </div>
                                            <div class="flex-1">
                                                <h4 class="text-base font-semibold text-surface-900 dark:text-surface-0 mb-1">{{ item.name }}</h4>
                                                <p class="text-sm text-muted-color mb-2" *ngIf="item.description">{{ item.description }}</p>
                                                <div class="flex items-center gap-2">
                                                    <p-tag [value]="item.category" severity="secondary" styleClass="text-xs"></p-tag>
                                                    <span class="text-xs text-muted-color" *ngIf="item.checkedOutAt">
                                                        Since {{ formatDate(item.checkedOutAt) }}
                                                    </span>
                                                </div>
                                            </div>
                                            <div *ngIf="isOwnProfile">
                                                <p-button 
                                                    icon="pi pi-sign-out" 
                                                    severity="warn"
                                                    [outlined]="true"
                                                    size="small"
                                                    pTooltip="Check In"
                                                    (onClick)="checkInInventoryItem(item)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div *ngIf="!checkedOutItems || checkedOutItems.length === 0" class="text-center py-6 text-muted-color">
                                    <i class="pi pi-inbox text-5xl mb-3"></i>
                                    <p class="text-base">No items currently checked out</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </ng-container>

        <!-- Certificate View Dialog -->
        <p-dialog [(visible)]="certViewDialogVisible" header="Certificate" [modal]="true" [style]="{width: '50rem'}" [breakpoints]="{'960px': '90vw'}" appendTo="body">
            <img *ngIf="certViewUrl" [src]="certViewUrl" alt="Certificate" style="display:block;width:100%;height:auto;border-radius:4px;" />
        </p-dialog>
    `
})
export class Profile implements OnInit {
    isProfileLoading = true;
    isProjectsLoading = true;
    isCertificatesLoading = true;
    isItemsLoading = true;
    isOwnProfile = true;
    profileUserId = '';
    checkedOutItems: InventoryItem[] = [];
    private route = inject(ActivatedRoute);
    private projectsService = inject(ProjectsService);
    private inventoryService = inject(InventoryService);
    private presenceService = inject(PresenceService);

    constructor(private authService: AuthService, private http: HttpClient, private confirmationService: ConfirmationService, private messageService: MessageService) {
        // Use effect to reactively update when currentUser signal changes (only for own profile)
        // This should only execute when viewing own profile and user data changes
        effect(() => {
            const user = this.authService.currentUser();
            // Only reload if we're on our own profile page (no userId in route params)
            if (user && this.isOwnProfile && !this.route.snapshot.paramMap.has('userId')) {
                this.loadUserProfile();
            }
        });
    }

    kosovoCities: string[] = [
        'Prishtina', 'Prizren', 'Peja', 'Gjakova', 'Ferizaj', 'Mitrovica',
        'Gjilan', 'Vushtrri', 'Podujeva', 'Suhareka', 'Lipjan', 'Drenas',
        'Rahovec', 'Skenderaj', 'Klinë', 'Istog', 'Deçan', 'Malisheva',
        'Kaçanik', 'Shtime', 'Vitia', 'Kamenicë', 'Zveçan', 'Zubin Potok',
        'Leposaviq'
    ];

    editDialogVisible = false;
    editProfile: any = {
        picture: '',
        firstName: '',
        lastName: '',
        email: '',
        biography: '',
        phone: '',
        location: '',
        website: '',
        skills: [],
        socialLinks: {
            github: '',
            linkedin: '',
            twitter: '',
            steam: '',
            instagram: '',
            youtube: '',
            spotify: ''
        }
    };
    skillsString = '';
    selectedFile: File | null = null;

    roleOptions = [
        { label: 'Member', value: 'Member' },
        { label: 'Board Member', value: 'Board Member' },
        { label: 'Admin', value: 'Admin' }
    ];

    userProfile = {
        picture: '',
        bannerUrl: '',
        firstName: '',
        lastName: '',
        email: '',
        dateJoined: '',
        activity: 'Online',
        role: '',
        biography: '',
        skills: [] as string[],
        phone: '',
        location: '',
        website: '',
        cvUrl: '' as string,
        socialLinks: {
            github: '',
            linkedin: '',
            twitter: '',
            steam: '',
            instagram: '',
            youtube: '',
            spotify: ''
        }
    };

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const userId = params.get('userId');

            if (userId) {
                // Viewing another user's profile
                this.isOwnProfile = false;
                this.loadUserById(userId);
            } else {
                // Viewing own profile - profile data comes from the signal/effect
                this.isOwnProfile = true;
                this.loadUserProfile();
                this.loadCheckedOutItems();
            }
        });
    }

    loadUserById(userId: string) {
        this.isProfileLoading = true;
        this.isProjectsLoading = true;
        this.isCertificatesLoading = true;
        this.isItemsLoading = true;
        this.profileUserId = userId;
        this.presenceService.fetchStatuses([userId]);
        this.http.get<User>(`${environment.apiUrl}/Auth/users/${userId}`).subscribe({
            next: (user) => {
                console.log('Fetched user data:', user);
                this.mapUserToProfile(user);
                this.isProfileLoading = false;
                this.loadUserProjects(userId);
                this.loadUserCertificates(userId);
                this.loadCheckedOutItems();
            },
            error: (err) => {
                console.error('Error loading user:', err);
                this.isProfileLoading = false;
                this.isProjectsLoading = false;
                this.isCertificatesLoading = false;
                this.isItemsLoading = false;
            }
        });
    }

    mapUserToProfile(user: User) {
        let pictureUrl = '';
        if (user.profilePictureUrl) {
            pictureUrl = user.profilePictureUrl.startsWith('http')
                ? user.profilePictureUrl
                : `${environment.baseUrl}${user.profilePictureUrl}`;
        }

        let cvUrl = '';
        if (user.cvUrl) {
            cvUrl = user.cvUrl.startsWith('http')
                ? user.cvUrl
                : `${environment.baseUrl}${user.cvUrl}`;
        }

        let bannerUrl = '';
        if (user.bannerUrl) {
            bannerUrl = user.bannerUrl.startsWith('http')
                ? user.bannerUrl
                : `${environment.baseUrl}${user.bannerUrl}`;
        }

        this.userProfile = {
            ...this.userProfile,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            role: user.roles?.[0] || 'Member',
            dateJoined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            picture: pictureUrl,
            bannerUrl: bannerUrl,
            biography: user.biography || '',
            phone: user.phoneNumber || '',
            location: user.location || '',
            website: user.websiteUrl || '',
            skills: user.skills || [],
            cvUrl: cvUrl,
            socialLinks: this.parseSocialLinks(user.socialLinks)
        };
    }

    onForgotPassword() {
        if (!this.userProfile.email) return;
        this.resettingPassword = true;
        this.authService.forgotPassword(this.userProfile.email).subscribe({
            next: () => {
                this.resettingPassword = false;
                this.messageService.add({
                    severity: 'info',
                    summary: 'Email Sent',
                    detail: 'Check your inbox for a password reset link.'
                });
            },
            error: () => {
                this.resettingPassword = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to send reset link. Please try again later.'
                });
            }
        });
    }

    loadUserProfile() {
        const user = this.authService.currentUser() as User | null;
        console.log('Logged in user data:', user);
        if (user) {
            this.profileUserId = user.id;
            this.presenceService.fetchStatuses([user.id]);
            // Construct full picture URL if it's a relative path
            let pictureUrl = '';
            if (user.profilePictureUrl) {
                pictureUrl = user.profilePictureUrl.startsWith('http')
                    ? user.profilePictureUrl
                    : `${environment.baseUrl}${user.profilePictureUrl}`;
            }

            let cvUrl = '';
            if (user.cvUrl) {
                cvUrl = user.cvUrl.startsWith('http')
                    ? user.cvUrl
                    : `${environment.baseUrl}${user.cvUrl}`;
            }

            let bannerUrl = '';
            if (user.bannerUrl) {
                bannerUrl = user.bannerUrl.startsWith('http')
                    ? user.bannerUrl
                    : `${environment.baseUrl}${user.bannerUrl}`;
            }

            this.userProfile = {
                ...this.userProfile,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                role: user.roles?.[0] || 'Member',
                dateJoined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
                picture: pictureUrl,
                bannerUrl: bannerUrl,
                biography: user.biography || '',
                phone: user.phoneNumber || '',
                location: user.location || '',
                website: user.websiteUrl || '',
                skills: user.skills || [],
                cvUrl: cvUrl,
                socialLinks: this.parseSocialLinks(user.socialLinks)
            };

            this.isProfileLoading = false;

            // Load user's projects
            if (user.id) {
                this.loadUserProjects(user.id);
                this.loadUserCertificates(user.id);
                this.loadCheckedOutItems();
            }
        }
    }

    userProjects: any[] = [];
    userCertificates: any[] = [];
    certViewDialogVisible = false;
    certViewUrl = '';

    loadUserProjects(userId: string) {
        this.isProjectsLoading = true;
        this.projectsService.getProjectsByUserId(userId).subscribe({
            next: (projects) => {
                this.userProjects = projects.map(project => {
                    // Find the user's role in this project
                    const userMember = project.teamMembers?.find((tm: any) => tm.userId === userId);
                    const role = userMember?.role || 'Team Member';

                    // Map team members with proper avatar URLs
                    const team = (project.teamMembers || []).map((tm: any) => ({
                        name: `${tm.firstName} ${tm.lastName}`,
                        avatar: tm.profilePictureUrl
                            ? (tm.profilePictureUrl.startsWith('http')
                                ? tm.profilePictureUrl
                                : `${environment.baseUrl}${tm.profilePictureUrl}`)
                            : ''
                    }));

                    return {
                        id: project.id,
                        name: project.title,
                        description: project.description,
                        status: project.status?.toLowerCase().replace(' ', '-') || 'in-progress',
                        progress: project.progressPercentage || 0,
                        role: role,
                        team: team
                    };
                });
                this.isProjectsLoading = false;
            },
            error: (err) => {
                console.error('Error loading user projects:', err);
                this.userProjects = [];
                this.isProjectsLoading = false;
            }
        });
    }

    loadCheckedOutItems() {
        if (!this.profileUserId) return;
        this.isItemsLoading = true;

        const observable = this.isOwnProfile
            ? this.inventoryService.getMyInventoryItems()
            : this.inventoryService.getInventoryItemsByUser(this.profileUserId);

        observable.subscribe({
            next: (items) => {
                this.checkedOutItems = items;
                console.log('Checked out items:', items);
                this.isItemsLoading = false;
            },
            error: (err) => {
                console.error('Error loading checked out items:', err);
                this.checkedOutItems = [];
                this.isItemsLoading = false;
            }
        });
    }

    loadUserCertificates(userId: string) {
        this.isCertificatesLoading = true;
        this.http.get<any[]>(`${environment.apiUrl}/Certificates/user/${userId}`).subscribe({
            next: (certs) => {
                this.userCertificates = certs;
                this.isCertificatesLoading = false;
            },
            error: (err) => {
                console.error('Error loading certificates:', err);
                this.userCertificates = [];
                this.isCertificatesLoading = false;
            }
        });
    }

    viewCertificateImage(cert: any) {
        this.http.get(`${environment.apiUrl}/Certificates/${cert.id}/image`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                this.certViewUrl = URL.createObjectURL(blob);
                this.certViewDialogVisible = true;
            },
            error: (err) => {
                console.error('Error loading certificate image:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load certificate image' });
            }
        });
    }

    downloadCertificate(cert: any) {
        this.http.get(`${environment.apiUrl}/Certificates/${cert.id}/download`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${cert.eventName}-certificate.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Error downloading certificate:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to download certificate' });
            }
        });
    }

    profileCheckinDialogVisible = false;
    profileCheckinItem: InventoryItem | null = null;
    profileCheckinQuantity = 1;
    profileCheckinMaxQuantity = 1;
    resettingPassword = false;

    checkInInventoryItem(item: InventoryItem) {
        this.profileCheckinItem = item;
        this.profileCheckinMaxQuantity = item.checkedOutQuantity || 1;
        this.profileCheckinQuantity = this.profileCheckinMaxQuantity;
        this.profileCheckinDialogVisible = true;
    }

    submitProfileCheckin() {
        if (!this.profileCheckinItem) return;

        if (this.profileCheckinQuantity < 1) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Quantity',
                detail: 'Quantity must be at least 1'
            });
            return;
        }

        if (this.profileCheckinQuantity > this.profileCheckinMaxQuantity) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Quantity',
                detail: `Cannot check in more than ${this.profileCheckinMaxQuantity} unit(s) that you have checked out`
            });
            return;
        }

        this.http.post(`${environment.apiUrl}/Inventory/${this.profileCheckinItem.id}/checkin`, {
            quantity: this.profileCheckinQuantity
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${this.profileCheckinQuantity} unit(s) of ${this.profileCheckinItem!.name} checked in successfully`
                });
                this.profileCheckinDialogVisible = false;
                this.loadCheckedOutItems();
            },
            error: (err) => {
                console.error('Error checking in item:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.Message || err.error?.message || err.error?.Errors?.[0] || 'Failed to check in item'
                });
            }
        });
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' {
        switch (status) {
            case 'completed': return 'success';
            case 'in-progress': return 'info';
            case 'upcoming': return 'warn';
            default: return 'info';
        }
    }

    // Parse social links array from backend into object
    parseSocialLinks(links: string[] | null | undefined): { github: string; linkedin: string; twitter: string; steam: string; instagram: string; youtube: string; spotify: string } {
        const socialLinks = { github: '', linkedin: '', twitter: '', steam: '', instagram: '', youtube: '', spotify: '' };
        if (!links || !Array.isArray(links)) {
            return socialLinks;
        }
        links.forEach(link => {
            if (!link) return;
            if (link.includes('github.com')) {
                socialLinks.github = link;
            } else if (link.includes('linkedin.com')) {
                socialLinks.linkedin = link;
            } else if (link.includes('twitter.com') || link.includes('x.com')) {
                socialLinks.twitter = link;
            } else if (link.includes('steamcommunity.com') || link.includes('steam')) {
                socialLinks.steam = link;
            } else if (link.includes('instagram.com')) {
                socialLinks.instagram = link;
            } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
                socialLinks.youtube = link;
            } else if (link.includes('spotify.com')) {
                socialLinks.spotify = link;
            }
        });
        return socialLinks;
    }

    // Serialize social links object back to array for backend
    serializeSocialLinks(socialLinks: { github: string; linkedin: string; twitter: string; steam: string; instagram: string; youtube: string; spotify: string }): string[] {
        const links: string[] = [];
        if (socialLinks.github) links.push(socialLinks.github);
        if (socialLinks.linkedin) links.push(socialLinks.linkedin);
        if (socialLinks.twitter) links.push(socialLinks.twitter);
        if (socialLinks.steam) links.push(socialLinks.steam);
        if (socialLinks.instagram) links.push(socialLinks.instagram);
        if (socialLinks.youtube) links.push(socialLinks.youtube);
        if (socialLinks.spotify) links.push(socialLinks.spotify);
        return links;
    }

    openEditDialog() {
        // Clone the current profile for editing
        console.log('userProfile.socialLinks:', this.userProfile.socialLinks);
        this.editProfile = {
            ...this.userProfile,
            socialLinks: {
                github: this.userProfile.socialLinks.github || '',
                linkedin: this.userProfile.socialLinks.linkedin || '',
                twitter: this.userProfile.socialLinks.twitter || '',
                steam: this.userProfile.socialLinks.steam || '',
                instagram: this.userProfile.socialLinks.instagram || '',
                youtube: this.userProfile.socialLinks.youtube || '',
                spotify: this.userProfile.socialLinks.spotify || ''
            }
        };
        console.log('editProfile.socialLinks:', this.editProfile.socialLinks);
        this.skillsString = this.userProfile.skills.join(', ');
        this.editDialogVisible = true;
    }

    onBannerSelect(event: any) {
        const file = event.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('bannerFile', file);
        this.http.post<any>(`${environment.apiUrl}/Auth/me/banner`, formData).subscribe({
            next: (response) => {
                if (response.bannerUrl) {
                    this.userProfile.bannerUrl = response.bannerUrl.startsWith('http')
                        ? response.bannerUrl
                        : `${environment.baseUrl}${response.bannerUrl}`;
                }
                this.authService.updateCurrentUser({ ...response });
            },
            error: (err) => console.error('Error uploading banner:', err)
        });
    }

    deleteBanner() {
        this.http.delete<any>(`${environment.apiUrl}/Auth/me/banner`).subscribe({
            next: (response) => {
                this.userProfile.bannerUrl = '';
                this.authService.updateCurrentUser({ ...response });
            },
            error: (err) => console.error('Error deleting banner:', err)
        });
    }

    onFileSelect(event: any) {
        const file = event.files[0];
        if (file) {
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.editProfile.picture = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    deleteProfilePicture() {
        this.http.delete(`${environment.apiUrl}/Auth/me/profile-picture`).subscribe({
            next: () => {
                console.log('Profile picture deleted successfully');
                // Reset to default avatar
                this.editProfile.picture = '';
                this.userProfile.picture = '';
                this.selectedFile = null;

                // Update auth service
                const currentUser = this.authService.currentUser() as User | null;
                if (currentUser) {
                    this.authService.updateCurrentUser({
                        ...currentUser,
                        profilePictureUrl: ''
                    } as any);
                }
            },
            error: (error) => {
                console.error('Error deleting profile picture:', error);
            }
        });
    }

    saveProfile() {
        // Parse skills string into array
        this.editProfile.skills = this.skillsString
            .split(',')
            .map((skill: string) => skill.trim())
            .filter((skill: string) => skill.length > 0);

        // Prepare FormData for multipart/form-data
        const formData = new FormData();
        formData.append('biography', this.editProfile.biography || '');
        formData.append('phoneNumber', this.editProfile.phone || '');
        formData.append('location', this.editProfile.location || '');
        formData.append('websiteUrl', this.editProfile.website || '');

        // Append skills as separate entries
        this.editProfile.skills.forEach((skill: string) => {
            formData.append('skills', skill);
        });

        // Append social links as separate entries
        const socialLinksArray = this.serializeSocialLinks(this.editProfile.socialLinks);
        socialLinksArray.forEach((link: string) => {
            formData.append('socialLinks', link);
        });

        // Append profile picture if a new one was selected
        if (this.selectedFile) {
            formData.append('profilePicture', this.selectedFile);
        }

        this.http.patch(`${environment.apiUrl}/Auth/me`, formData).subscribe({
            next: (response: any) => {
                console.log('Profile updated successfully:', response);
                // Update the local user profile
                Object.assign(this.userProfile, this.editProfile);

                // If response contains new profile picture URL, update it
                if (response.profilePictureUrl) {
                    this.userProfile.picture = response.profilePictureUrl.startsWith('http')
                        ? response.profilePictureUrl
                        : `${environment.baseUrl}${response.profilePictureUrl}`;
                }

                // Update the auth service's currentUser signal with the new data
                this.authService.updateCurrentUser({
                    ...response,
                    role: response.roles?.length > 0 ? response.roles[0] : undefined
                });

                this.selectedFile = null;
                this.editDialogVisible = false;
            },
            error: (error) => {
                console.error('Error updating profile:', error);
            }
        });
    }

    onCVSelect(event: any) {
        const file = event.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('cvFile', file);

            this.http.post(`${environment.apiUrl}/Auth/me/cv`, formData).subscribe({
                next: (response: any) => {
                    console.log('CV uploaded successfully:', response);
                    if (response.cvUrl) {
                        this.userProfile.cvUrl = response.cvUrl.startsWith('http')
                            ? response.cvUrl
                            : `${environment.baseUrl}${response.cvUrl}`;
                    }
                    // Reload user data to refresh the CV URL
                    this.authService.loadCurrentUser();
                },
                error: (error) => {
                    console.error('Error uploading CV:', error);
                    alert(error.error?.Errors?.[0] || 'Failed to upload CV. Only PDF files are allowed.');
                }
            });
        }
    }

    deleteCV() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete your CV?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: {
                severity: 'danger'
            },
            accept: () => {
                this.http.delete(`${environment.apiUrl}/Auth/me/cv`).subscribe({
                    next: (response: any) => {
                        console.log('CV deleted successfully:', response);
                        this.userProfile.cvUrl = '';
                        // Reload user data
                        this.authService.loadCurrentUser();
                    },
                    error: (error) => {
                        console.error('Error deleting CV:', error);
                    }
                });
            }
        });
    }

    downloadCV() {
        if (!this.profileUserId) return;

        this.http.get(`${environment.apiUrl}/Auth/users/${this.profileUserId}/cv/download`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${this.userProfile.firstName}_${this.userProfile.lastName}_CV.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                console.error('Error downloading CV:', error);
            }
        });
    }

    // Helper methods for avatar display
    getInitials(name: string): string {
        return getInitials(name);
    }

    hasProfilePicture(pictureUrl: string | undefined): boolean {
        return !!pictureUrl && !isDefaultAvatar(pictureUrl);
    }

    getInventoryItemImageUrl(item: InventoryItem): string {
        if (item.thumbnailPath) {
            return item.thumbnailPath.startsWith('http')
                ? item.thumbnailPath
                : `${environment.baseUrl}${item.thumbnailPath}`;
        }
        if (item.images && item.images.length > 0) {
            const firstImage = item.images[0];
            return firstImage.filePath.startsWith('http')
                ? firstImage.filePath
                : `${environment.baseUrl}${firstImage.filePath}`;
        }
        return '';
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return 'Yesterday';
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }

    getPresenceStatus(): string {
        if (!this.profileUserId) return 'Offline';
        return this.presenceService.getPresence(this.profileUserId).status;
    }

    getLastActiveText(): string {
        if (!this.profileUserId) return 'Offline';
        const p = this.presenceService.getPresence(this.profileUserId);
        if (p.status === 'Online') return 'Online';
        if (p.status === 'Idle') return 'Idle';
        if (p.lastActivityAt) {
            const date = new Date(p.lastActivityAt);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
                ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return 'Offline';
    }
}
