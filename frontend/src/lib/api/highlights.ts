import api from './client';
import type { Highlight } from '../types';

export const getHighlights = async (bookId: number | string) => {
    const { data } = await api.get<Highlight[]>(`/reading/highlights/${bookId}/`);
    return data;
};

export const createHighlight = async (
    bookId: number | string,
    payload: Omit<Highlight, 'id' | 'book' | 'created_at' | 'updated_at'>
) => {
    const { data } = await api.post<Highlight>(`/reading/highlights/${bookId}/`, payload);
    return data;
};

export const updateHighlight = async (
    highlightId: string,
    payload: Partial<Pick<Highlight, 'note' | 'color'>>
) => {
    const { data } = await api.patch<Highlight>(`/reading/highlights/${highlightId}/detail/`, payload);
    return data;
};

export const deleteHighlight = async (highlightId: string) => {
    await api.delete(`/reading/highlights/${highlightId}/detail/`);
};
