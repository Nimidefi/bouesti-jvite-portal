"""Initial schema

Revision ID: dd41a56c28a5
Revises: 
Create Date: 2026-07-09 02:49:39.146822

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd41a56c28a5'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'submissions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('abstract', sa.String(), nullable=False),
        sa.Column('keywords', sa.String(), nullable=False),
        sa.Column('author', sa.String(), nullable=False),
        sa.Column('coAuthors', sa.String(), nullable=True),
        sa.Column('manuscriptName', sa.String(), nullable=False),
        sa.Column('manuscriptSize', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('submittedAt', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_submissions_id'), 'submissions', ['id'], unique=False)

    op.create_table(
        'editors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_editors_id'), 'editors', ['id'], unique=False)
    op.create_index(op.f('ix_editors_email'), 'editors', ['email'], unique=True)

    op.create_table(
        'board_members',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_board_members_id'), 'board_members', ['id'], unique=False)
    op.create_index(op.f('ix_board_members_email'), 'board_members', ['email'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_board_members_email'), table_name='board_members')
    op.drop_index(op.f('ix_board_members_id'), table_name='board_members')
    op.drop_table('board_members')
    op.drop_index(op.f('ix_editors_email'), table_name='editors')
    op.drop_index(op.f('ix_editors_id'), table_name='editors')
    op.drop_table('editors')
    op.drop_index(op.f('ix_submissions_id'), table_name='submissions')
    op.drop_table('submissions')
