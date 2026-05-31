export interface HistoryLogEntry {
    date: string;
    action: string;
    detail?: string;
    detailImageUrl?: string;
    userFullName?: string;
    userProfilePictureUrl?: string;
    icon: string;
    color: string;
}

export interface LogDto {
    id: string;
    entityType: string;
    entityId: string;
    entityName: string;
    action: string;
    detail?: string;
    userId: string;
    userFullName: string;
    userProfilePictureUrl?: string;
    timestamp: string;
}

export interface PaginatedLogsResponse {
    data: LogDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
